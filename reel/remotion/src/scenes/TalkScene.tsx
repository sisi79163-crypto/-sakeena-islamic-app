import {AbsoluteFill} from 'remotion';
import {SourceScene} from '../Shared';
import {SCENES} from '../timeline';

const S = SCENES.talk;

/** The source carries its own caption here, so nothing is laid over it. */
export const TalkScene: React.FC = () => (
  <AbsoluteFill>
    <SourceScene
      trimBefore={S.trimBefore}
      playbackRate={S.playbackRate}
      durationInFrames={S.duration}
      motion="talk"
      push={[1.025, 1.075]}
      drift={[8, -10]}
      darken={0.02}
    />
  </AbsoluteFill>
);
