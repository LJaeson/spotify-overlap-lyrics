import subprocess
import sys;

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


if __name__ == "__main__":


    
    setWebProxy(sys.argv[1] if sys.argv[1] else 'Wi-Fi', "127.0.0.1", "7381")