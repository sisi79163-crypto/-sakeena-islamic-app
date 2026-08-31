import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {GOLD, SAFE_SIDE, SourceScene, arabic} from '../Shared';
import {SCENES} from '../timeline';

const S = SCENES.hadith;

/**
 * Emotional centrepiece. The hadith itself is the source video's own artwork,
 * so it is never re-typeset here: character motion is switched off, the push-in
 * is almost still, and the only thing added is the attribution, which fades in
 * once the third line of the hadith has finished revealing.
 */
export const HadithScene: React.FC = () => {
  const frame = useCurrentFrame();
  const ramp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

  return (
    <AbsoluteFill>
      <SourceScene
        trimBefore={S.trimBefore}
        playbackRate={S.playbackRate}
        durationInFrames={S.duration}
        push={[1.015, 1.045]}
        drift={[0, -6]}
        darken={0.07}
        fadeIn
      />

      {/* A touch of light behind the card, nothing that costs contrast. */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 44%, rgba(96,168,224,0.10), transparent 54%)',
          opacity: interpolate(frame, [0, 40], [0, 1], ramp),
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: SAFE_SIDE + 40,
          right: SAFE_SIDE + 40,
          bottom: 348,
          padding: '18px 26px 20px',
          borderRadius: 22,
          backgroundColor: 'rgba(4, 16, 29, 0.62)',
          outline: '1px solid rgba(233, 205, 146, 0.28)',
          ...arabic(38, GOLD, 1.3),
          opacity: interpolate(frame, [252, 280, 412, 428], [0, 1, 1, 0], ramp),
        }}
      >
        حديث صحيح — رواه مسلم ٢٥٨٩
      </div>
    </AbsoluteFill>
  );
};
