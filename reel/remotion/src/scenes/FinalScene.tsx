import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CREAM, Panel, RED, Rule, SourceScene, arabic} from '../Shared';
import {SCENES} from '../timeline';

const S = SCENES.final;

/**
 * The closing question, held long enough to be read twice, on the source's own
 * final empty frame.
 */
export const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const ramp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

  return (
    <AbsoluteFill>
      <SourceScene
        trimBefore={S.trimBefore}
        playbackRate={S.playbackRate}
        durationInFrames={S.duration}
        push={[1.0, 1.05]}
        drift={[0, -5]}
        darken={0.52}
      />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <Panel
          opacity={interpolate(frame, [8, 28, 276, 289], [0, 1, 1, 0], ramp)}
          scale={interpolate(frame, [8, 36], [0.97, 1], ramp)}
        >
          <Rule />
          <div
            style={{
              ...arabic(62, CREAM, 1.52),
              opacity: interpolate(frame, [16, 38, 188, 214], [0, 1, 1, 0.3], ramp),
            }}
          >
            قبل أن تتحدث عن شخصٍ غائب…
            <div style={{...arabic(52, '#d9e7f3'), marginTop: 16}}>اسأل نفسك:</div>
          </div>
          <div
            style={{
              ...arabic(72, '#ff6069', 1.42),
              marginTop: 26,
              opacity: interpolate(frame, [190, 218], [0, 1], ramp),
              scale: interpolate(frame, [190, 228], [0.955, 1], ramp),
              textShadow: `0 8px 30px rgba(0,0,0,0.74), 0 0 34px ${RED}55`,
            }}
          >
            هل ترضى أن تأكل لحمه؟
          </div>
        </Panel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
