import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {RED, SAFE_BOTTOM, SourceScene, arabic} from '../Shared';
import {SCENES} from '../timeline';

const S = SCENES.tongue;

/** A beat of quiet on the source's own empty frame before the closing question. */
export const TongueScene: React.FC = () => {
  const frame = useCurrentFrame();
  const ramp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
  const reveal = interpolate(frame, [6, 24, 96, 112], [0, 1, 1, 0], ramp);

  return (
    <AbsoluteFill>
      <SourceScene
        trimBefore={S.trimBefore}
        playbackRate={S.playbackRate}
        durationInFrames={S.duration}
        motion="none"
        push={[1.04, 1.0]}
        drift={[0, 0]}
        darken={0.30}
      />
      <AbsoluteFill
        style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: SAFE_BOTTOM + 120}}
      >
        <div style={{opacity: reveal, scale: interpolate(frame, [6, 28], [0.96, 1], ramp)}}>
          <div style={arabic(76)}>
            لسانك… <span style={{color: RED}}>إمّا لك أو عليك.</span>
          </div>
          <div
            style={{
              width: interpolate(frame, [10, 40], [0, 380], ramp),
              height: 5,
              borderRadius: 20,
              margin: '30px auto 0',
              background: `linear-gradient(90deg, transparent, ${RED}, transparent)`,
              boxShadow: `0 0 24px ${RED}b3`,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
