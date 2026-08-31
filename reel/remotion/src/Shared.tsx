import {Video} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

export const CREAM = '#f6fbff';
export const RED = '#ef4d58';
export const GOLD = '#e9cd92';

// Vertical safe area for social UI overlays.
export const SAFE_TOP = 220;
export const SAFE_BOTTOM = 330;
export const SAFE_SIDE = 96;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const softFade = (
  frame: number,
  duration: number,
  {inFrames = 12, outFrames = 12}: {inFrames?: number; outFrames?: number} = {},
) =>
  interpolate(
    frame,
    [0, inFrames, duration - outFrames, duration - 1],
    [inFrames === 0 ? 1 : 0, 1, 1, outFrames === 0 ? 1 : 0],
    {easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

/**
 * One layer of the source clip, masked to a body region and nudged by a couple
 * of pixels so a character that is drawn completely still reads as alive.
 * The mask edges are feathered with a gradient so the moving layer never shows
 * a seam against the still frame underneath it.
 */
const MotionLayer: React.FC<{
  trimBefore: number;
  playbackRate: number;
  mask: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  origin: string;
}> = ({trimBefore, playbackRate, mask, x, y, rotate, scale, origin}) => (
  <AbsoluteFill
    style={{
      maskImage: mask,
      WebkitMaskImage: mask,
      transformOrigin: origin,
      translate: `${x}px ${y}px`,
      rotate: `${rotate}deg`,
      scale,
    }}
  >
    <Video
      src={staticFile('graded.mp4')}
      trimBefore={trimBefore}
      playbackRate={playbackRate}
      muted
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
  </AbsoluteFill>
);

type MotionMode = 'none' | 'gossip' | 'talk' | 'reflection';

// Feathered elliptical masks over the three standing figures and, for the two
// scenes where a character gestures, over the gesturing arm.
const MASKS: Record<Exclude<MotionMode, 'none'>, {mask: string; origin: string; phase: number; amp: number}[]> = {
  gossip: [
    {mask: 'radial-gradient(ellipse 26% 30% at 20% 66%, #000 42%, transparent 100%)', origin: '20% 88%', phase: 0, amp: 1.0},
    {mask: 'radial-gradient(ellipse 27% 32% at 50% 63%, #000 42%, transparent 100%)', origin: '50% 90%', phase: 9, amp: 1.25},
    {mask: 'radial-gradient(ellipse 26% 30% at 80% 66%, #000 42%, transparent 100%)', origin: '80% 88%', phase: 18, amp: 1.0},
    {mask: 'radial-gradient(ellipse 13% 11% at 42% 56%, #000 34%, transparent 100%)', origin: '42% 66%', phase: 4, amp: 1.5},
  ],
  talk: [
    {mask: 'radial-gradient(ellipse 25% 33% at 21% 64%, #000 42%, transparent 100%)', origin: '21% 90%', phase: 3, amp: 1.2},
    {mask: 'radial-gradient(ellipse 25% 31% at 54% 66%, #000 42%, transparent 100%)', origin: '54% 90%', phase: 12, amp: 0.9},
    {mask: 'radial-gradient(ellipse 25% 31% at 82% 66%, #000 42%, transparent 100%)', origin: '82% 90%', phase: 21, amp: 0.9},
    {mask: 'radial-gradient(ellipse 12% 10% at 33% 58%, #000 34%, transparent 100%)', origin: '33% 68%', phase: 6, amp: 1.6},
  ],
  reflection: [
    {mask: 'radial-gradient(ellipse 25% 32% at 22% 65%, #000 42%, transparent 100%)', origin: '22% 90%', phase: 5, amp: 0.9},
    {mask: 'radial-gradient(ellipse 26% 33% at 51% 63%, #000 42%, transparent 100%)', origin: '51% 90%', phase: 14, amp: 1.15},
    {mask: 'radial-gradient(ellipse 25% 32% at 80% 65%, #000 42%, transparent 100%)', origin: '80% 90%', phase: 23, amp: 0.9},
    {mask: 'radial-gradient(ellipse 12% 11% at 51% 52%, #000 34%, transparent 100%)', origin: '51% 62%', phase: 8, amp: 1.4},
  ],
};

export const SourceScene: React.FC<{
  trimBefore: number;
  playbackRate: number;
  durationInFrames: number;
  motion: MotionMode;
  /** Slow push-in: [start, end] scale. */
  push?: [number, number];
  drift?: [number, number];
  darken?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}> = ({
  trimBefore,
  playbackRate,
  durationInFrames,
  motion,
  push = [1.03, 1.085],
  drift = [-7, -11],
  darken = 0,
  fadeIn = true,
  fadeOut = true,
}) => {
  const frame = useCurrentFrame();
  const opacity = softFade(frame, durationInFrames, {
    inFrames: fadeIn ? 12 : 0,
    outFrames: fadeOut ? 12 : 0,
  });
  const span: [number, number] = [0, durationInFrames - 1];
  const ramp = {easing: EASE, extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

  return (
    <AbsoluteFill style={{backgroundColor: '#07121d', opacity}}>
      <AbsoluteFill
        style={{
          scale: interpolate(frame, span, push, ramp),
          translate: `${interpolate(frame, span, [0, drift[0]], ramp)}px ${interpolate(frame, span, [0, drift[1]], ramp)}px`,
        }}
      >
        <Video
          src={staticFile('graded.mp4')}
          trimBefore={trimBefore}
          playbackRate={playbackRate}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />

        {motion === 'none'
          ? null
          : MASKS[motion].map((m, i) => (
              <MotionLayer
                key={i}
                trimBefore={trimBefore}
                playbackRate={playbackRate}
                mask={m.mask}
                origin={m.origin}
                x={Math.sin((frame + m.phase) / 19) * 1.4 * m.amp}
                y={Math.sin((frame + m.phase) / 13) * 1.5 * m.amp}
                rotate={Math.sin((frame + m.phase) / 24) * 0.09 * m.amp}
                scale={1 + Math.sin((frame + m.phase) / 15) * 0.0022 * m.amp}
              />
            ))}
      </AbsoluteFill>

      {/* One grade for every scene so nothing looks disconnected. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 52% 40%, rgba(255,246,230,0.05) 0%, transparent 34%, rgba(2,9,16,0.20) 72%, rgba(1,5,10,0.52) 100%)',
        }}
      />
      <AbsoluteFill style={{backgroundColor: `rgba(3, 12, 22, ${darken})`}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundSize: '340px 340px',
          opacity: 0.032,
          mixBlendMode: 'soft-light',
          translate: `${(frame % 3) - 1}px ${((frame + 1) % 3) - 1}px`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Panel: React.FC<{
  children: React.ReactNode;
  opacity: number;
  scale?: number;
}> = ({children, opacity, scale = 1}) => (
  <div
    style={{
      width: 1080 - SAFE_SIDE * 2,
      padding: '48px 52px 54px',
      boxSizing: 'border-box',
      borderRadius: 40,
      background: 'linear-gradient(150deg, rgba(6,17,29,0.86), rgba(9,30,50,0.70))',
      boxShadow: '0 30px 84px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.13)',
      outline: '1px solid rgba(255,255,255,0.10)',
      backdropFilter: 'blur(13px)',
      opacity,
      scale,
    }}
  >
    {children}
  </div>
);

export const Rule: React.FC<{width?: number; color?: string}> = ({
  width = 140,
  color = RED,
}) => (
  <div
    style={{
      width,
      height: 6,
      borderRadius: 12,
      margin: '0 auto 30px',
      backgroundColor: color,
      boxShadow: `0 0 26px ${color}a8`,
    }}
  />
);

export const arabic = (fontSize: number, color = CREAM, lineHeight = 1.45) =>
  ({
    fontFamily: 'ArabicDisplay',
    direction: 'rtl' as const,
    textAlign: 'center' as const,
    fontSize,
    lineHeight,
    color,
    textShadow: '0 6px 24px rgba(0,0,0,0.66)',
  });
