import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {EndScene} from './scenes/EndScene';
import {FinalScene} from './scenes/FinalScene';
import {HadithScene} from './scenes/HadithScene';
import {HookScene} from './scenes/HookScene';
import {ReflectionScene} from './scenes/ReflectionScene';
import {TalkScene} from './scenes/TalkScene';
import {TongueScene} from './scenes/TongueScene';
import {SCENES, SFX, TOTAL, VOICE} from './timeline';

const SCENE_COMPONENTS = [
  {key: 'hook', name: 'Hook - one word of yours', Component: HookScene},
  {key: 'talk', name: 'Talking about someone absent', Component: TalkScene},
  {key: 'hadith', name: 'Hadith - centrepiece', Component: HadithScene},
  {key: 'reflection', name: 'How would it feel said of you', Component: ReflectionScene},
  {key: 'tongue', name: 'Your tongue is for you or against you', Component: TongueScene},
  {key: 'final', name: 'Closing question', Component: FinalScene},
  {key: 'end', name: 'Guard your tongue', Component: EndScene},
] as const;

export const NameemaVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#050b12'}}>
      <style>{`@font-face { font-family: 'ArabicDisplay'; src: url('${staticFile(
        'arabic-bold.ttf',
      )}') format('truetype'); font-weight: 700; font-style: normal; font-display: block; }`}</style>

      {SCENE_COMPONENTS.map(({key, name, Component}) => {
        const s = SCENES[key];
        return (
          <Sequence key={key} name={name} from={s.from} durationInFrames={s.duration}>
            <Component />
          </Sequence>
        );
      })}

      {/* Room tone under the whole piece. No music at any point. */}
      <Sequence from={0} durationInFrames={TOTAL}>
        <Audio src={staticFile('ambience.wav')} volume={0.5} />
      </Sequence>

      {VOICE.map((v, i) => (
        <Sequence key={`vo-${i}`} from={v.from} durationInFrames={v.duration}>
          <Audio src={staticFile(v.file)} volume={1} />
        </Sequence>
      ))}

      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.from} durationInFrames={s.duration}>
          <Audio src={staticFile(s.file)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
