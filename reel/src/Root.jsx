import {Composition} from 'remotion';
import clips from './clips.json';
import {FPS, Reel, TRANSITION_FRAMES} from './Reel';

const durationInFrames =
  clips.reduce((sum, clip) => sum + clip.frames, 0) - (clips.length - 1) * TRANSITION_FRAMES;

export const RemotionRoot = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={durationInFrames}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={{clips}}
  />
);
