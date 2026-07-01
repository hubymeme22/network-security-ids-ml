import asyncio
import logging
import time

from collections import deque
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.packet import Packet
from scapy.all import sniff

logger = logging.getLogger("uvicorn.error")

packet_history = deque(maxlen=100)
connection_starts = {}
packet_queue = asyncio.Queue(maxsize=1000)

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

    logger.info("Starting background network sniffing via Scapy...")
    sniff(filter="ip", prn=packet_handler, store=0)
