#DECREPCATED









# import os 
# import subprocess
# import re
# # import pathlib
# from pathlib import Path

# def trust_mitmproxy_cert():
#     # Path to the mitmproxy cert (usually created after first run)
#     cert_path = os.path.expanduser("~/.mitmproxy/mitmproxy-ca-cert.pem")
    
#     if os.path.exists(cert_path):
#         try:
#             # Add the cert to the System Keychain and set to 'Always Trust'
#             # keychainPath = os.homedir(), 'Library/Keychains/login.keychain-db');
#             keychain_path = Path.home() / "Library" / "Keychains" / "login.keychain-db"

#             cmd = [
#                 "sudo", "security", "add-trusted-cert", 
#                 "-d", "-r", "trustRoot", 
#                 "-k", keychain_path, 
#                 cert_path
#             ]
#             subprocess.run(cmd, check=True)
#             print("Successfully added certificate to Keychain. Check for the password prompt.")
#         except subprocess.CalledProcessError as e:
#             print(f"Failed to install cert: {e}")
#     else:
#         print("Cert not found. Run mitmproxy once first to generate it.")


# if __name__ == "__main__":
    
#     trust_mitmproxy_cert()




import os 
import subprocess
import re

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
    
    trust_mitmproxy_cert()