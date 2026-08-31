import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Panel, RED, SAFE_BOTTOM, SourceScene, arabic, softFade} from '../Shared';
import {SCENES} from '../timeline';

const S = SCENES.hook;

/**
 * First two seconds: the frame is already pushing in, the hook line lands on
 * frame 0 with a low impact under it, then the overlay clears so the source
 * scene (and its own caption) plays in the open.
 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const ramp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

  return (
    <AbsoluteFill>
      <SourceScene
        trimBefore={S.trimBefore}
        playbackRate={S.playbackRate}
        durationInFrames={S.duration}
        push={[1.10, 1.035]}
        drift={[6, 10]}
        darken={0.04}
        fadeIn={false}
      />

      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(2,8,14,${interpolate(
            frame,
            [0, 54, 96],
            [0.30, 0.16, 0],
            ramp,
          )}) 0%, rgba(2,8,14,${interpolate(frame, [0, 54, 96], [0.72, 0.46, 0], ramp)}) 100%)`,
        }}
      />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: SAFE_BOTTOM}}>
        <Panel
          opacity={softFade(frame, S.duration, {inFrames: 8, outFrames: 0}) * interpolate(frame, [86, 104], [1, 0], ramp)}
          scale={interpolate(frame, [0, 18], [0.962, 1], ramp)}
        >
          <div style={arabic(80, undefined, 1.34)}>
            كلمة واحدة منك…
            <div
              style={{
                ...arabic(102, RED, 1.3),
                marginTop: 12,
                scale: interpolate(frame, [16, 34], [0.94, 1], ramp),
                opacity: interpolate(frame, [14, 30], [0, 1], ramp),
              }}
            >
              قد تأكل حسناتك.
            </div>
          </div>
        </Panel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
