import asyncio
import re
import json
import time
import blackboxprotobuf
from mitmproxy import http, options
import sys
from mitmproxy.tools.dump import DumpMaster

import base64
import gzip



lyrics_map = {}
current_song = None
playback_time = 0
last_update_local = 0
pausing = False



def decrypt_connectState(encoded_data):
    raw_data = encoded_data

    if raw_data.startswith(b'\x1f\x8b'):
            raw_data = gzip.decompress(raw_data)


    messageDic, _ = blackboxprotobuf.decode_message(raw_data)

    return messageDic

def get_playback_time(messageDic):

    # print(messageDic)
    playbackState = messageDic.get('3', {})
    playbackState = playbackState.get('10')

    return playbackState
    # print(playbackState)

def get_playback_time2(messageDic):

    # print(messageDic)
    playbackState = messageDic.get('2', {})
    playbackState = playbackState.get('2', {})
    playbackState = playbackState.get('10')

    return playbackState
    # print(playbackState)


def get_pausing(messageDic):

    playbackState = messageDic.get('3', {}).get('17', {})
    if (playbackState.get('2')):
        return False
    else:
        return True

def get_pausing2(messageDic):

    playbackState = messageDic.get('2', {}).get('2', {}).get('17', {})
    if (playbackState.get('1')):
        return True
    else:
        return False
###################################
async def lyrics_timer_loop():

    global playback_time, current_song, lyrics_map, last_update_local, pausing
    
    # print("🎤 Lyrics Timer Active...")
    last_printed_line = ""

    while True:
        if current_song and current_song in lyrics_map:
            if (pausing):
                last_update_local = time.time()
                pass
                
            # print("hahahah")
            if last_update_local > 0:
                elapsed_since_update = (time.time() - last_update_local) * 1000
                estimated_time = playback_time + elapsed_since_update
            else:
                estimated_time = playback_time

            
            lines = lyrics_map[current_song].get('lyrics', {}).get('lines', [])
            current_line = ""
            for line in lines:
                if estimated_time >= int(line['startTimeMs']):
                    current_line = line['words']
                else:
                    break
            
           
            if current_line != last_printed_line:
                print(current_line)
                sys.stdout.flush()
                # print(f"\r[{time.strftime('%M:%S', time.gmtime(estimated_time/1000))}] 🎤 {current_line: <80}", end="")
                last_printed_line = current_line

        await asyncio.sleep(0.05) 


class SpotifyLogger:
    # def responseheaders(self, flow: http.HTTPFlow):
    #     # 1. Enable streaming immediately for Spotify URLs 
    #     # This prevents mitmproxy from buffering on your slow connection
    #     if "spotify.com" in flow.request.pretty_url:
    #         flow.response.stream = True
    def request(self, flow:http.HTTPFlow):
        global current_song, playback_time, lyrics_map, last_update_local, pausing

        # if change the playback time
        if "gae2-spclient.spotify.com/connect-state/v1/devices/" in flow.request.pretty_url:
            decrypted_data2 = decrypt_connectState(flow.request.content)
            # print(decrypted_data2)
            playback_time = result if (result := get_playback_time2(decrypted_data2)) is not None else 0
            pausing = get_pausing2(decrypted_data2)
            last_update_local = time.time()
            # print(f"debug {playback_time}")
            # decrypted_data = decrypt_connectState(flow.response.content)

            # playback_time = result if (result := get_playback_time(decrypted_data)) is not None else 0
            # pausing = get_pausing(decrypted_data)
            # last_update_local = time.time()
            # print(f"debug {playback_time}")


        # new song
        if "api-partner.spotify.com/pathfinder/v2/query" in flow.request.pretty_url:
            data = json.loads(flow.request.content)

            try:
                track_uri = data['variables']['trackUri']
                if track_uri:
                    current_song = track_uri.split(':')[-1]

                    # print(lyrics_map[current_song])

            except Exception:
                pass

            # print(current_song)


            
    def response(self, flow: http.HTTPFlow):

        global current_song, playback_time, lyrics_map, last_update_local, pausing

        #add the lyric to the lyric map
        if "spclient.wg.spotify.com/color-lyrics" in flow.request.pretty_url:
            match = re.search(r'track/([a-zA-Z0-9]{22})', flow.request.pretty_url)
            track_id = match.group(1)

            # print(track_id)
            if flow.response.content:
                # lyrics_map[track_id] = flow.response.content

                # decompressed_lyrics = gzip.decompress(flow.response.content)
                lyrics_map[track_id] = json.loads(flow.response.content)
            




async def start_proxy():
    opts = options.Options(
        listen_host='127.0.0.1',
        listen_port=8000,
        allow_hosts=[r"spotify\.com"],
        # flow_detail = 0
    )

    master = DumpMaster(opts)

    try:
        opts.update(flow_detail=0, termlog_verbosity="error")
    except KeyError:
        pass
    
    master.addons.add(SpotifyLogger())

    asyncio.create_task(lyrics_timer_loop())

    try:
        await master.run()
    except KeyboardInterrupt:
        master.shutdown()

if __name__ == "__main__":
    asyncio.run(start_proxy())