import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CaptionChunk} from '../core/captions';
import {secondsToFrames} from '../core/timing';

export function CaptionOverlay({chunks, offsetSeconds = 0}: {chunks: CaptionChunk[]; offsetSeconds?: number}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const active = chunks.find((chunk) => {
    const start = secondsToFrames(chunk.startSeconds - offsetSeconds, fps);
    const end = secondsToFrames(chunk.endSeconds - offsetSeconds, fps);
    return frame >= start && frame <= end;
  });

  if (!active) return null;
  const start = secondsToFrames(active.startSeconds - offsetSeconds, fps);
  const entrance = interpolate(frame - start, [0, 8], [0.78, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const words = active.text.split(' ');

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 290, pointerEvents: 'none'}}>
      <div style={{transform: `scale(${entrance})`, display: 'flex', gap: 16, maxWidth: 900, flexWrap: 'wrap', justifyContent: 'center'}}>
        {words.map((word) => (
          <span key={word} style={{fontFamily: 'Arial, sans-serif', fontSize: 58, fontWeight: 900, color: word.toLowerCase() === active.highlight?.toLowerCase() ? '#3B62DB' : '#141414', textShadow: '0 3px 0 #ffffff, 3px 0 0 #ffffff, -3px 0 0 #ffffff'}}>
            {word}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}
