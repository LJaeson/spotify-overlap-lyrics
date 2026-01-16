// function profile = () => {
import { useEffect, useState } from 'react';

// export const Lyrics = () => {
//   const [currentLine, setCurrentLine] = useState("Waiting...");

//   useEffect(() => {
//     // Use the bridge we defined in preload.ts
//     (window as any).api.onLyric((text: string) => {
//       setCurrentLine(text);
//     });
//   }, []);

//   return <div>Current Lyric: {currentLine}</div>;
// };


export default function Lyrics() {
    const [currentLine, setCurrentLine] = useState("Waiting ...");

    useEffect(() => {
        (window as any).api.onLyric((text: string) => {
            setCurrentLine(text);
        });
    }, []);
    return (
        <>
            {currentLine}
        </>
    )
}