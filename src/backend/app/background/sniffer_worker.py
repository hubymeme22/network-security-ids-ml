import asyncio
import logging
import time
import threading

from collections import deque
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.packet import Packet
from scapy.all import sniff
from scapy.arch import compile_filter
from typing import Any


logger = logging.getLogger("uvicorn.error")

class EvictingAsyncQueue:
    """
    Asyncronous DSA that removes old queued packets
    """
    def __init__(self, maxsize: int):
        self.maxsize = maxsize
        self._queue: deque = deque(maxlen=maxsize)
        self._getter_futures: deque = deque()

    def put_nowait(self, item: Any) -> None:
        """synchronously drops an item into the queue. drops the oldest if full."""
        while self._getter_futures:
            future = self._getter_futures.popleft()
            if not future.done():
                future.set_result(item)
                return
        
        self._queue.append(item)

    async def get(self) -> Any:
        """asynchronously waits for and pops the oldest item in the queue."""
        if self._queue:
            return self._queue.popleft()

        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self._getter_futures.append(future)
        return await future

    def task_done(self) -> None:
        """maintains structural compatibility with standard asyncio.Queue APIs."""
        pass


packet_queue = EvictingAsyncQueue(maxsize=2000)
packet_history = deque(maxlen=100)
connection_starts = {}


def nsl_kdd_packet_parser(packet: Packet) -> dict:
    """
    Packet parser for retrieving and loading previous packet history
    which can be used to format the receiving packet similar to nsl-kdd format.
    This enables us to use the data as input for our ML model
    """
    if not packet.haslayer(IP):
        return None

    current_time = time.time()
    proto_num = packet[IP].proto

    proto_map = {6: "tcp", 17: "udp", 1: "icmp"}
    protocol_type = proto_map.get(proto_num, "other")

    src_ip = packet[IP].src
    dst_ip = packet[IP].dst

    # determine ports and flags based on protocol
    src_port, dst_port = 0, 0
    flag = "SF"
    service = "private"

    if protocol_type == "tcp" and packet.haslayer(TCP):
        src_port = packet[TCP].sport
        dst_port = packet[TCP].dport

        # smple mapping of TCP flags to NSL-KDD shorthand (e.g., S0, SF, REJ)
        tcp_flags = packet[TCP].flags
        if "S" in tcp_flags and "A" not in tcp_flags:
            flag = "S0"
        elif "R" in tcp_flags:
            flag = "REJ"

        # rough mapping of common ports to services
        port_services = {22: "ssh", 80: "http", 443: "http", 21: "ftp", 23: "telnet", 25: "smtp"}
        service = port_services.get(dst_port, "private")

    elif protocol_type == "udp" and packet.haslayer(UDP):
        src_port = packet[UDP].sport
        dst_port = packet[UDP].dport
        service = "domain" if (dst_port == 53 or src_port == 53) else "other"

    elif protocol_type == "icmp" and packet.haslayer(ICMP):
        service = "ecr_i" if packet[ICMP].type == 8 else "icmp" # echo request

    # calculate duration & bytes
    conn_key = (src_ip, src_port, dst_ip, dst_port, protocol_type)
    rev_conn_key = (dst_ip, dst_port, src_ip, src_port, protocol_type)

    # Track duration (rough approximation for live streaming)
    if conn_key not in connection_starts and rev_conn_key not in connection_starts:
        connection_starts[conn_key] = current_time
        duration = 0
    else:
        start = connection_starts.get(conn_key, connection_starts.get(rev_conn_key))
        duration = int(current_time - start)
        # Clean up old tracking entries periodically to prevent memory leaks
        if len(connection_starts) > 1000:
            connection_starts.clear()

    src_bytes = len(packet[IP].payload) if src_ip == packet[IP].src else 0
    dst_bytes = len(packet[IP].payload) if dst_ip == packet[IP].src else 0

    # Note: Live extraction of features like "num_failed_logins" requires fully decoding 
    # application layers (like FTP/SSH), which Scapy alone cannot easily do inline.
    # We default these to 0/False so your dictionary structurally matches the model"s expected inputs.
    content_features = {
        "land": 1 if (src_ip == dst_ip and src_port == dst_port) else 0,
        "wrong_fragment": packet[IP].frag if packet[IP].frag > 0 else 0,
        "urgent": packet[TCP].urgptr if (protocol_type == "tcp" and "U" in packet[TCP].flags) else 0,
        "hot": 0, "num_failed_logins": 0, "logged_in": 0, "num_compromised": 0,
        "root_shell": 0, "su_attempted": 0, "num_root": 0, "num_file_creations": 0,
        "num_shells": 0, "num_access_files": 0, "num_outbound_cmds": 0,
        "is_host_login": 0, "is_guest_login": 0
    }

    # sliding window for Time-based / Connection features
    current_packet_info = {
        "time": current_time, "src_ip": src_ip, "dst_ip": dst_ip,
        "service": service, "dst_port": dst_port, "flag": flag
    }
    packet_history.append(current_packet_info)

    # same host features (connections to the same destination IP)
    same_dst = [p for p in packet_history if p["dst_ip"] == dst_ip]
    count = len(same_dst)

    # same service features (connections to the same destination port/service)
    same_srv = [p for p in packet_history if p["dst_port"] == dst_port]
    srv_count = len(same_srv)

    serror_rate = sum(1 for p in same_dst if p["flag"] == "S0") / count if count > 0 else 0.0
    srv_serror_rate = sum(1 for p in same_srv if p["flag"] == "S0") / srv_count if srv_count > 0 else 0.0
    
    rerror_rate = sum(1 for p in same_dst if p["flag"] == "REJ") / count if count > 0 else 0.0
    srv_rerror_rate = sum(1 for p in same_srv if p["flag"] == "REJ") / srv_count if srv_count > 0 else 0.0

    same_srv_rate = sum(1 for p in same_dst if p["service"] == service) / count if count > 0 else 0.0
    diff_srv_rate = sum(1 for p in same_dst if p["service"] != service) / count if count > 0 else 0.0
    srv_diff_host_rate = sum(1 for p in same_srv if p["dst_ip"] != dst_ip) / srv_count if srv_count > 0 else 0.0

    kdd_features = {
        "duration": duration, "protocol_type": protocol_type, "service": service, "flag": flag,
        "src_bytes": src_bytes, "dst_bytes": dst_bytes,
        **content_features,
        "count": count, "srv_count": srv_count,
        "serror_rate": serror_rate, "srv_serror_rate": srv_serror_rate,
        "rerror_rate": rerror_rate, "srv_rerror_rate": srv_rerror_rate,
        "same_srv_rate": same_srv_rate, "diff_srv_rate": diff_srv_rate,
        "srv_diff_host_rate": srv_diff_host_rate,

        # destination host features (for a live sliding window, these tightly align with the above statistics)
        "dst_host_count": count,
        "dst_host_srv_count": srv_count,
        "dst_host_same_srv_rate": same_srv_rate,
        "dst_host_diff_srv_rate": diff_srv_rate,
        "dst_host_same_src_port_rate": sum(1 for p in same_dst if p["src_ip"] == src_ip) / count if count > 0 else 0.0,
        "dst_host_srv_diff_host_rate": srv_diff_host_rate,
        "dst_host_serror_rate": serror_rate,
        "dst_host_srv_serror_rate": srv_serror_rate,
        "dst_host_rerror_rate": rerror_rate,
        "dst_host_srv_rerror_rate": srv_rerror_rate
    }

    return kdd_features


class SnifferManager:
    """
    Manages the runtime state of the Scapy sniffer worker,
    allowing thread-safe filter updates and restarts.
    """
    def __init__(self):
        self.filter_string = "ip"
        self._restart_event = threading.Event()
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

    def get_filter(self) -> str:
        with self._lock:
            return self.filter_string

    def set_filter(self, filter_str: str) -> bool:
        """
        Validates the BPF filter string. If valid, updates the filter and triggers a restart.
        """
        try:
            # validate BPF syntax using Scapy's internal compiler
            compile_filter(filter_str, linktype=1)
        except Exception as e:
            logger.error(f"Failed to validate filter '{filter_str}': {e}")
            raise ValueError(f"Invalid BPF filter string: {e}")

        with self._lock:
            self.filter_string = filter_str
            self._restart_event.set()
        return True

    def should_stop(self) -> bool:
        return self._stop_event.is_set()

    def check_restart(self) -> bool:
        return self._restart_event.is_set()

    def clear_restart(self):
        self._restart_event.clear()

    def stop(self):
        self._stop_event.set()
        self._restart_event.set()

sniffer_manager = SnifferManager()

def scapy_sniff_worker(loop: asyncio.AbstractEventLoop):
    """
    runs in a dedicated background thread. Parses packets synchronously,
    then threadsafely pushes the dictionary into FastAPI's async event loop queue.
    """
    def packet_handler(packet):
        if packet.haslayer(IP):
            features = nsl_kdd_packet_parser(packet)
            if features:
                loop.call_soon_threadsafe(packet_queue.put_nowait, features)

    def stop_filter(packet):
        return sniffer_manager.check_restart() or sniffer_manager.should_stop()

    logger.info("Starting background network sniffing via Scapy...")
    while not sniffer_manager.should_stop():
        # clear the restart event at the beginning of this run
        sniffer_manager.clear_restart()
        current_filter = sniffer_manager.get_filter()
        logger.info(f"IDS Engine: Starting Scapy sniff with filter: '{current_filter}'")

        try:
            # use timeout=1.0 so that if there's no traffic, the sniff call will time out
            # and allow the loop to check should_stop() or get a new filter.
            # stop_filter will handle the case where traffic IS flowing and we want to stop immediately.
            sniff(filter=current_filter, prn=packet_handler, store=0, stop_filter=stop_filter, timeout=1.0)

        except Exception as e:
            logger.error(f"IDS Engine: Error during sniffing with filter '{current_filter}': {e}")
            if current_filter != "ip":
                logger.warning("Reverting filter to default 'ip' due to sniffing runtime error.")
                with sniffer_manager._lock:
                    sniffer_manager.filter_string = "ip"
            time.sleep(1.0)
