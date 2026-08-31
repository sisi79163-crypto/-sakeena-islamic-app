import {Composition} from 'remotion';
import {NameemaVideo} from './NameemaVideo';
import {FPS, TOTAL} from './timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NameemaFinal"
      component={NameemaVideo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
