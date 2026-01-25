import subprocess
import sys

def unsetWebProxy(service):
    """
    Turns off both HTTP and HTTPS proxies for the specified network service.
    """
    try:
        # Commands to disable the proxy
        http_off = ['networksetup', '-setwebproxystate', service, 'off']
        https_off = ['networksetup', '-setsecurewebproxystate', service, 'off']

        subprocess.run(http_off, check=True)
        subprocess.run(https_off, check=True)
        
        print(f"Successfully disabled web proxy for: {service}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to unset proxy: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    
    unsetWebProxy(sys.argv[1] if sys.argv[1] else 'Wi-Fi')