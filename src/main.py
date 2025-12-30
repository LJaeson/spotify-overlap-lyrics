from mitmproxy import http
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

#remember to change the "Wifi" to the correct service
setWebProxy("Wi-Fi", "127.0.0.1", "8000")


# def response(flow: http.HTTPFlow):
#     # This captures every response from the app
#     if "spclient.wg.spotify.com" in flow.request.pretty_url:
#         print(f"Captured Data: {flow.response.content}")