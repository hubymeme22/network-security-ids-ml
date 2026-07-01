from fastapi import APIRouter
from app.utils.devices import list_devices

system_router = APIRouter()

@system_router.get("/network-cards")
def get_system_devices():
    """
    Retrieves this system's network card interfaces
    """
    interfaces = psutil.net_if_addrs()
    interface_names = []
    for interface_name, addresses in interfaces.items():
        interface_names.append(interface_name)

    return { "interfaces": interface_names }


@system_router.get("/usage")
def get_system_usage():
    """
    Retrieves current system usage of the hosted vm
    returns system and process cpu and ram usage
    """
    system_cpu = psutil.cpu_percent(interval=1.0)
    mem_info = psutil.virtual_memory()
    system_ram_percent = mem_info.percent
    system_ram_used_gb = mem_info.used / (1024**3)
    system_ram_total_gb = mem_info.total / (1024**3)

    current_process = psutil.Process(os.getpid())
    process_cpu = current_process.cpu_percent(interval=None)
    process_ram_mb = current_process.memory_info().rss / (1024**2)

    return {
        "system_cpu_percent": system_cpu,
        "system_ram_gb": system_ram_used_gb,
        "proecess_cpu_percent": process_cpu,
        "process_ram_mp": process_ram_mb
    }
