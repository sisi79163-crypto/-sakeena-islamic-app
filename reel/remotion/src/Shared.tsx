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
export const SAFE_BOTTOM = 330;
export const SAFE_SIDE = 96;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const softFade = (
  frame: number,
  duration: number,
  {inFrames = 12, outFrames = 12}: {inFrames?: number; outFrames?: number} = {},
) => {
  const at: number[] = [];
  const to: number[] = [];
  if (inFrames > 0) {
    at.push(0, inFrames);
    to.push(0, 1);
  } else {
    at.push(0);
    to.push(1);
  }
  if (outFrames > 0) {
    at.push(duration - outFrames, duration - 1);
    to.push(1, 0);
  } else {
    at.push(duration - 1);
    to.push(1);
  }
  return interpolate(frame, at, to, {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/**
 * A window onto the source clip.
 *
 * The grade, the film grain, the vignette and the per-character micro-motion
 * are all baked into graded.mp4 by scripts/grade.sh, so a scene costs one video
 * layer plus a transform here. Everything this component adds on top is the
 * camera: a slow push-in and a drift, which is what keeps a still illustration
 * from reading as a slideshow.
 */
export const SourceScene: React.FC<{
  trimBefore: number;
  playbackRate: number;
  durationInFrames: number;
  push?: [number, number];
  drift?: [number, number];
  darken?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}> = ({
  trimBefore,
  playbackRate,
  durationInFrames,
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
  const ramp = {
    easing: EASE,
    extrapolateLeft: 'clamp' as const,
    extrapolateRight: 'clamp' as const,
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#07121d', opacity}}>
      <AbsoluteFill
        style={{
          scale: interpolate(frame, span, push, ramp),
          translate: `${interpolate(frame, span, [0, drift[0]], ramp)}px ${interpolate(
            frame,
            span,
            [0, drift[1]],
            ramp,
          )}px`,
        }}
      >
        <Video
          src={staticFile('graded.mp4')}
          trimBefore={trimBefore}
          playbackRate={playbackRate}
          muted
          objectFit="cover"
          style={{width: '100%', height: '100%'}}
        />
      </AbsoluteFill>

      {darken > 0 ? (
        <AbsoluteFill style={{backgroundColor: `rgba(3, 12, 22, ${darken})`}} />
      ) : null}
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
      background: 'linear-gradient(150deg, rgba(6,17,29,0.90), rgba(9,30,50,0.80))',
      boxShadow: '0 30px 84px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.13)',
      outline: '1px solid rgba(255,255,255,0.10)',
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

export const arabic = (fontSize: number, color = CREAM, lineHeight = 1.45) => ({
  fontFamily: 'ArabicDisplay',
  direction: 'rtl' as const,
  textAlign: 'center' as const,
  fontSize,
  lineHeight,
  color,
  textShadow: '0 6px 24px rgba(0,0,0,0.66)',
});
