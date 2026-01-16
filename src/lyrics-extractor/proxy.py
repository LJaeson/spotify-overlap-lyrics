import os 
import subprocess
import re

# this is still not working!!!!!!!!!!!!!!!!!!!!!!!!!!
def get_active_service_name():
    try:
        output = subprocess.check_output(['networksetup', '-listallnetworkservices']).decode()
        services = [line.strip() for line in output.split('\n') if line.strip() and "denotes" not in line]

        print(services)


        # 1. Get the primary interface (e.g., en0)
        route_cmd = ["route", "-n", "get", "default"]
        route_output = subprocess.check_output(route_cmd).decode()
        interface_match = re.search(r"interface:\s+(\w+)", route_output)
        
        if not interface_match:
            return None
        
        target_device = interface_match.group(1)

        # 2. Map that device (en0) to a Service Name (Wi-Fi)
        service_order = subprocess.check_output(["networksetup", "-listnetworkserviceorder"]).decode()
        
        # Look for the pattern: (Hardware Port: ..., Device: en0)
        # We want the Service Name that precedes it
        pattern = rf"\(\d+\)\s+(.*?)\s+\(Hardware Port:.*?, Device:\s+{target_device}\)"
        match = re.search(pattern, service_order)
        
        if match:
            return match.group(1)
            
    except Exception as e:
        print(f"Error detecting service: {e}")
    
    return None

def setWebProxy(service, host, port):
    try:
        httpLine = ['networksetup', '-setwebproxy', service, host, port]
        httpsLine = ['networksetup', '-setsecurewebproxy', service, host, port]

        subprocess.run(httpLine, check=True)
        subprocess.run(httpsLine, check=True)
    except subprocess.CalledProcessError:
        print("error")
    except Exception:
        print("error")


def trust_mitmproxy_cert():
    # Path to the mitmproxy cert (usually created after first run)
    cert_path = os.path.expanduser("~/.mitmproxy/mitmproxy-ca-cert.pem")
    
    if os.path.exists(cert_path):
        try:
            # Add the cert to the System Keychain and set to 'Always Trust'
            cmd = [
                "sudo", "security", "add-trusted-cert", 
                "-d", "-r", "trustRoot", 
                "-k", "/Library/Keychains/System.keychain", 
                cert_path
            ]
            subprocess.run(cmd, check=True)
            print("Successfully added certificate to Keychain. Check for the password prompt.")
        except subprocess.CalledProcessError as e:
            print(f"Failed to install cert: {e}")
    else:
        print("Cert not found. Run mitmproxy once first to generate it.")

if __name__ == "__main__":
    #remember to change the "Wifi" to the correct service


    # service = get_active_service_name()

    # if service:
    #     setWebProxy(service, "127.0.0.1", "8000")
    #     trust_mitmproxy_cert()
    # else:
    #     print("error")
    
    setWebProxy("Tailscale", "127.0.0.1", "8000")


    # Call this before starting proxy logic
    trust_mitmproxy_cert()