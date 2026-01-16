import os 
import subprocess

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




#remember to change the "Wifi" to the correct service
setWebProxy("Wi-Fi", "127.0.0.1", "8000")


# Call this before starting your proxy logic
trust_mitmproxy_cert()