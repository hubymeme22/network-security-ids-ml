# Dataset Column Definition
Below are the definitions of each columns in the NSL-KDD dataset, the following below are interpreted by gemini, and can be used as reference for data interpretations from notebook.


## 1. Basic Features (Core Connection Layer)

These attributes describe the structural properties of individual network connections.

| Attribute Name | Data Type | Description & Cybersecurity Meaning |
| --- | --- | --- |
| **`duration`** | Numeric (Real) | Length of the connection in seconds. (e.g., $0$ for a lightning-fast ping, thousands for a persistent connection). |
| **`protocol_type`** | Categorical (Text) | The transport protocol used: `tcp`, `udp`, or `icmp`. |
| **`service`** | Categorical (Text) | The network service targeted at the destination (e.g., `http`, `smtp`, `private`, `ftp`). |
| **`flag`** | Categorical (Text) | Error or completion status of the connection handshake (e.g., `SF` = normal connection setup/teardown; `S0` = connection attempt seen but no response). |
| **`src_bytes`** | Numeric (Real) | Total bytes sent from the source host to the destination host. (Prone to extreme outliers during data exfiltration). |
| **`dst_bytes`** | Numeric (Real) | Total bytes sent from the destination host back to the source host. |
| **`land`** | Binary (`0` or `1`) | `1` if the source and destination IP/ports are identical (indicating a LAND attack meant to freeze the target machine); `0` otherwise. |
| **`wrong_fragment`** | Numeric (Real) | Count of bad or corrupted packets/fragments. High counts indicate fragmentation attacks. |
| **`urgent`** | Numeric (Real) | Number of urgent packets. High numbers can signify an attacker attempting an out-of-band data exploit. |

---

## 2. Content Features (Payload Behavior Layer)

These look *inside* the data payload to look for indicators of suspicious user behavior, unauthorized access, or administrative privilege tracking.

| Attribute Name | Data Type | Description & Cybersecurity Meaning |
| --- | --- | --- |
| **`hot`** | Numeric (Real) | Number of "hot" indicators hit (e.g., trying to access system/configuration files, or executing system binaries). |
| **`num_failed_logins`** | Numeric (Real) | Count of failed login attempts. A key metric for spotting automated brute-force password cracking. |
| **`logged_in`** | Binary (`0` or `1`) | `1` if the login session was successful; `0` if not authenticated. |
| **`num_compromised`** | Numeric (Real) | Count of compromised conditions or unauthorized file changes detected during the session. |
| **`root_shell`** | Numeric (Real) | `1` if a root (administrator) shell or terminal session was successfully obtained; `0` otherwise. |
| **`su_attempted`** | Numeric (Real) | `1` if the "switch user to root" (`su`) command was run; `0` otherwise. |
| **`num_root`** | Numeric (Real) | Total number of root/admin file access operations executed. |
| **`num_file_creations`** | Numeric (Real) | Number of physical files created on the target system during the connection. |
| **`num_shells`** | Numeric (Real) | Number of terminal shell prompts started. |
| **`num_access_files`** | Numeric (Real) | Number of operations performed on system access control files (like permissions or group access files). |
| **`num_outbound_cmds`** | Numeric (Real) | Count of outbound commands in an FTP session. *(Note: This contains all zeros in this dataset and can be safely dropped).* |
| **`is_host_login`** | Binary (`0` or `1`) | `1` if the login belongs to an admin or a specific host list; `0` otherwise. |
| **`is_guest_login`** | Binary (`0` or `1`) | `1` if the user logged into a low-privileged temporary `guest` account; `0` otherwise. |

---

## 3. Time-Based Traffic Features (2-Second Window)

These analyze a rolling history lookback spanning a fast **two-second window**. They excel at catching high-volume automated attacks like DDoS floods or fast port scanning.

#### Same-Host Tracking (Traffic sent to the exact same Destination IP):

* **`count`**: Number of unique connections made to this destination host IP in the past 2 seconds.
* **`serror_rate`**: The percentage of connections in `count` that resulted in a "SYN" error (indicates a SYN flood DDoS attack).
* **`rerror_rate`**: The percentage of connections in `count` that triggered a "REJ" (Reject) error.
* **`same_srv_rate`**: Out of all connections to this host, the percentage that requested the *exact same service*.
* **`diff_srv_rate`**: Out of all connections to this host, the percentage that requested *different services* (indicates someone is scanning different ports looking for an open door).

#### Same-Service Tracking (Traffic targeting the exact same Service/Port):

* **`srv_count`**: Number of connections made to the *same service* as the current row in the past 2 seconds.
* **`srv_serror_rate`**: The percentage of connections in `srv_count` that had SYN errors.
* **`srv_rerror_rate`**: The percentage of connections in `srv_count` that had REJ errors.
* **`srv_diff_host_rate`**: The percentage of connections to this service that came from *different physical host machines*.

---

## 4. Host-Based Traffic Features (Last 100 Connections)

Unlike the time window, this category tracks the **last 100 sequential connections** to a host. This helps your model catch slow, stealthy, and patient scanning tools that intentionally space out their attacks over time.

| Attribute Name | Data Type | Description & Cybersecurity Meaning |
| --- | --- | --- |
| **`dst_host_count`** | Numeric (Real) | Count of recent connections to the same destination host. |
| **`dst_host_srv_count`** | Numeric (Real) | Count of recent connections to the same service on that host. |
| **`dst_host_same_srv_rate`** | Numeric (Real) | % of recent connections to that host targeting the same service. |
| **`dst_host_diff_srv_rate`** | Numeric (Real) | % of recent connections to that host targeting different services. |
| **`dst_host_same_src_port_rate`** | Numeric (Real) | % of connections to that host originating from the *exact same source port* (highly unusual for a normal user; a strong indicator of automated malware). |
| **`dst_host_srv_diff_host_rate`** | Numeric (Real) | % of connections to the same service on that host originating from different machines. |
| **`dst_host_serror_rate`** | Numeric (Real) | % of connections to the host that generated a SYN error. |
| **`dst_host_srv_serror_rate`** | Numeric (Real) | % of connections to that service on the host that generated a SYN error. |
| **`dst_host_rerror_rate`** | Numeric (Real) | % of connections to the host that generated a REJ error. |
| **`dst_host_srv_rerror_rate`** | Numeric (Real) | % of connections to that service on the host that generated a REJ error. |

---

## 5. The Ground Truth Label

* **`class`**: Categorical (`normal` or `anomaly`). This is what your model is trying to predict! In more advanced multi-class setups, `anomaly` is further broken down into **DoS, Probe, R2L, and U2R** classifications.