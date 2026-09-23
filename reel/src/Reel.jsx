import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';

export const FPS = 30;
export const TRANSITION_FRAMES = 15;

// Cinematic grade applied to every clip so the four shots feel like one piece.
const GRADE = 'contrast(1.08) saturate(1.15) brightness(1.03)';
const TRANSITIONS = [
  slide({direction: 'from-bottom'}),
  fade(),
  wipe({direction: 'from-right'}),
];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

const fill = {width: '100%', height: '100%'};

const Clip = ({clip}) => {
  const frame = useCurrentFrame();
  const src = staticFile(clip.file);
  const isPortrait = clip.height / clip.width >= 1.6;
  // Slow push-in keeps every shot moving.
  const scale = interpolate(frame, [0, clip.frames], [1, 1.08], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const volume = (f) =>
    interpolate(
      f,
      [0, TRANSITION_FRAMES, clip.frames - TRANSITION_FRAMES, clip.frames],
      [0, 1, 1, 0],
      clamp,
    );

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      {isPortrait ? null : (
        // Blurred copy fills the 9:16 frame behind non-vertical footage.
        <AbsoluteFill style={{transform: 'scale(1.25)', filter: 'blur(40px) brightness(0.5)'}}>
          <OffthreadVideo src={src} muted style={{...fill, objectFit: 'cover'}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{transform: `scale(${scale})`, filter: GRADE}}>
        <OffthreadVideo
          src={src}
          volume={volume}
          style={{...fill, objectFit: isPortrait ? 'cover' : 'contain'}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Warm light flash that peaks in the middle of every transition.
const Flashes = ({clips}) => {
  const frame = useCurrentFrame();
  let start = 0;
  let opacity = 0;
  clips.forEach((clip, i) => {
    if (i > 0) {
      const mid = start + TRANSITION_FRAMES / 2;
      opacity = Math.max(
        opacity,
        interpolate(frame, [start, mid, start + TRANSITION_FRAMES], [0, 0.35, 0], clamp),
      );
    }
    start += clip.frames - TRANSITION_FRAMES;
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: 'screen',
        background: 'radial-gradient(circle at 70% 30%, #fff4d6 0%, #ffb86b 45%, transparent 80%)',
      }}
    />
  );
};

const Vignette = () => (
  <AbsoluteFill
    style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}}
  />
);

// Fade in from black at the start and out to black at the end.
const FadeBlack = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 20, durationInFrames - 1],
    [1, 0, 0, 1],
    clamp,
  );
  return <AbsoluteFill style={{backgroundColor: 'black', opacity}} />;
};

export const Reel = ({clips}) => (
  <AbsoluteFill style={{backgroundColor: 'black'}}>
    <TransitionSeries>
      {clips.map((clip, i) => (
        <React.Fragment key={clip.file}>
          {i > 0 ? (
            <TransitionSeries.Transition
              presentation={TRANSITIONS[(i - 1) % TRANSITIONS.length]}
              timing={linearTiming({
                durationInFrames: TRANSITION_FRAMES,
                easing: Easing.inOut(Easing.cubic),
              })}
            />
          ) : null}
          <TransitionSeries.Sequence durationInFrames={clip.frames}>
            <Clip clip={clip} />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
    <Flashes clips={clips} />
    <Vignette />
    <FadeBlack />
  </AbsoluteFill>
);
