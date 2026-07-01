import socket

def list_devices():
    try:
        interfaces = socket.if_nameindex()
        return [name for _, name in interfaces]
    except AttributeError:
        return []
