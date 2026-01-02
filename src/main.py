import asyncio
import blackboxprotobuf
from mitmproxy import http, options
from mitmproxy.tools.dump import DumpMaster

import base64
import gzip

def decreypt(encoded_data):
    raw_data = encoded_data

    if raw_data.startswith(b'\x1f\x8b'):
            raw_data = gzip.decompress(raw_data)


    messageDic, _ = blackboxprotobuf.decode_message(raw_data)

    # print(messageDic)
    playbackState = messageDic.get('3', {})
    playbackState = playbackState.get('10')
    print(playbackState)




class SpotifyLogger:
    def response(self, flow: http.HTTPFlow):

        if "spclient.wg.spotify.com" in flow.request.pretty_url:
            print(f"Captured Data: {flow.response.content}")

        if "gae2-spclient.spotify.com/connect-state/v1/devices/" in flow.request.pretty_url:
            decreypt(flow.response.content)
            # print(flow.response.content)

        # if "spotify" in flow.request.pretty_host:
        #     print(f"Captured Spotify Data: {flow.response.content[:100]}...")

async def start_proxy():
    opts = options.Options(
        listen_host='127.0.0.1',
        listen_port=8000,
        allow_hosts=[r"spotify\.com"]  # Use regex for allow_hosts
    )

    master = DumpMaster(opts)
    
    master.addons.add(SpotifyLogger())

    try:
        await master.run()
    except KeyboardInterrupt:
        master.shutdown()

if __name__ == "__main__":
    asyncio.run(start_proxy())