// import { useEffect, useState } from 'react';
// import './Lyrics.css';


// export default function Lyrics() {
//     const [currentLine, setCurrentLine] = useState("Waiting ...");

//     useEffect(() => {


//         (window as any).api.onLyric((text: string) => {
//             setCurrentLine(text);
//         });
//     }, []);


//     return (
//         <div className="lyric-container">
//             <h1 className='lyric-text'>{currentLine}</h1>
//         </div>
//     )
// }




import { useEffect, useState, useRef } from 'react';
import './Lyrics.css';

export default function Lyrics() {
    const [currentLine, setCurrentLine] = useState("♪♪♪");
    // 1. Create a state to store the calculated height
    const [height, setHeight] = useState<number | string>('auto');
    
    // 2. Create a ref to measure the actual text element
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Listen for the lyric from the Electron bridge
        const removeListener = (window as any).api.onLyric((text: string) => {
            text ? setCurrentLine(text) : setCurrentLine("♪♪");
        });

        return () => {
            if (removeListener) removeListener();
        };
    }, []);

    // 3. This effect runs every time the text changes to measure the new size
    useEffect(() => {
        if (contentRef.current) {
            const measuredHeight = contentRef.current.offsetHeight;
            setHeight(measuredHeight);

            (window as any).api.setWindowSize(400, measuredHeight);
        }
    }, [currentLine]); // Dependency: run whenever the text updates

    return (
        /* The Outer Container: Handles the smooth height transition and clipping */
        <div 
            className="lyric-container" 
            style={{ 
                height: typeof height === 'number' ? `${height-15}px` : height,
                overflow: 'hidden',
                // transition: 'height 0s ease-in-out', // Makes the window grow/shrink smoothly
                backgroundColor: 'rgba(0,0,0,0.5)', // Example: semi-transparent for overlay
                borderRadius: '8px'
            }}
        >
            {/* The Inner Wrapper: Used for measurement */}
            <div ref={contentRef} style={{ padding: '15px' }}>
                <h1 className='lyric-text' style={{ margin: 0 }}>
                    {currentLine}
                </h1>
            </div>
        </div>
    );
}