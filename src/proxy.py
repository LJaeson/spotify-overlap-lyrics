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
    
    cert_path = os.path.expanduser("~/.mitmproxy/mitmproxy-ca-cert.pem")
    
    if os.path.exists(cert_path):
        try:
            
            cmd = [
                "sudo", "security", "add-trusted-cert", 
                "-d", "-r", "trustRoot", 
                "-k", "/Library/Keychains/System.keychain", 
                cert_path
            ]
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Failed: {e}")




#remember to change the "Wifi" to the correct service
setWebProxy("Wi-Fi", "127.0.0.1", "8000")



trust_mitmproxy_cert()