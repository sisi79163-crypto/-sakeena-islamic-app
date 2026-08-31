import {AbsoluteFill} from 'remotion';
import {SourceScene} from '../Shared';
import {SCENES} from '../timeline';

const S = SCENES.reflection;

/** "Would you accept this said about you?" - carried by narration alone. */
export const ReflectionScene: React.FC = () => (
  <AbsoluteFill>
    <SourceScene
      trimBefore={S.trimBefore}
      playbackRate={S.playbackRate}
      durationInFrames={S.duration}
      push={[1.02, 1.07]}
      drift={[-9, -8]}
      darken={0.04}
    />
  </AbsoluteFill>
);
