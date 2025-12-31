from mitmproxy import http


def response(flow: http.HTTPFlow):
    # This captures every response from the app
    if "spclient.wg.spotify.com" in flow.request.pretty_url:
        print(f"Captured Data: {flow.response.content}")