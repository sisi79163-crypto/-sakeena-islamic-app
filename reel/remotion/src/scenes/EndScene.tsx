import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {RED, Rule, arabic} from '../Shared';
import {SCENES} from '../timeline';

const S = SCENES.end;

/**
 * Closing card on the source's own sky blue, so the reel resolves back into the
 * artwork's palette rather than cutting to black.
 */
export const EndScene: React.FC = () => {
  const frame = useCurrentFrame();
  const ramp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(168deg, #58bddc 0%, #46abcd 55%, #2f90b6 100%)',
        opacity: interpolate(frame, [0, 14, S.duration - 10, S.duration - 1], [0, 1, 1, 0.92], ramp),
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 43%, rgba(255,255,255,0.10), transparent 36%, rgba(4,20,34,0.24) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundSize: '340px 340px',
          opacity: 0.03,
          mixBlendMode: 'soft-light',
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            opacity: interpolate(frame, [2, 18], [0, 1], ramp),
            scale: interpolate(frame, [2, 26], [0.95, 1], ramp),
          }}
        >
          <Rule width={128} color={RED} />
          <div style={arabic(112, '#ffffff', 1.3)}>احفظ لسانك.</div>
          <div
            style={{
              ...arabic(42, '#dceaf4'),
              marginTop: 32,
              opacity: interpolate(frame, [26, 44], [0, 1], ramp),
            }}
          >
            في أمان الله
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
