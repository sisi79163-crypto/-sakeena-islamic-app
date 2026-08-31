// Single source of truth for the edit.
// Output: 1080x1920, 30 fps, 1320 frames (44.0 s).
//
// The source clip (30.03 s @ 30 fps) has five continuous segments:
//   A  0.00 -  4.65 s  three men, the middle one whispering behind his hand
//   B  4.67 -  9.30 s  the man in the white thobe speaking to the other two
//   C  9.30 - 19.37 s  dark blue geometric card carrying the hadith text
//   D 19.37 - 24.82 s  the man in the white thobe, palm raised in a "stop" gesture
//   E 24.83 - 30.00 s  empty light-blue frame
//
// Every scene below walks the source forward, so the original scene order is
// preserved exactly and no segment is replayed.

export const FPS = 30;
export const TOTAL = 1320;

export const SCENES = {
  hook: {from: 0, duration: 186, trimBefore: 0, playbackRate: 0.75},
  talk: {from: 172, duration: 158, trimBefore: 140, playbackRate: 0.88},
  hadith: {from: 316, duration: 390, trimBefore: 279, playbackRate: 0.775},
  reflection: {from: 692, duration: 176, trimBefore: 581, playbackRate: 0.93},
  tongue: {from: 854, duration: 118, trimBefore: 745, playbackRate: 0.5},
  final: {from: 958, duration: 290, trimBefore: 804, playbackRate: 0.33},
  end: {from: 1228, duration: 92},
} as const;

// Narration, cut to land inside the scene it belongs to.
export const VOICE = [
  {file: 'voice01.mp3', from: 0, duration: 118},
  {file: 'voice02.mp3', from: 112, duration: 84},
  {file: 'voice03.mp3', from: 200, duration: 138},
  {file: 'voice10.mp3', from: 352, duration: 99},
  {file: 'voice15.mp3', from: 466, duration: 77},
  {file: 'voice05.mp3', from: 545, duration: 186},
  {file: 'voice06.mp3', from: 712, duration: 150},
  {file: 'voice12.mp3', from: 872, duration: 90},
  {file: 'voice13.mp3', from: 975, duration: 205},
  {file: 'voice14.mp3', from: 1186, duration: 73},
  {file: 'voice09.mp3', from: 1266, duration: 39},
] as const;

// Sound design. No music anywhere - these are all noise/impulse based effects.
export const SFX = [
  {file: 'impact.wav', from: 0, duration: 30, volume: 0.5},
  {file: 'cloth.wav', from: 70, duration: 14, volume: 0.32},
  {file: 'whoosh.wav', from: 166, duration: 20, volume: 0.3},
  {file: 'cloth.wav', from: 240, duration: 14, volume: 0.28},
  {file: 'riser.wav', from: 292, duration: 30, volume: 0.26},
  {file: 'impact.wav', from: 314, duration: 30, volume: 0.42},
  {file: 'tick.wav', from: 470, duration: 10, volume: 0.3},
  {file: 'tick.wav', from: 616, duration: 10, volume: 0.3},
  {file: 'whoosh.wav', from: 688, duration: 20, volume: 0.24},
  {file: 'cloth.wav', from: 726, duration: 14, volume: 0.28},
  {file: 'whoosh.wav', from: 850, duration: 20, volume: 0.24},
  {file: 'impact.wav', from: 862, duration: 30, volume: 0.3},
  {file: 'whoosh.wav', from: 954, duration: 20, volume: 0.26},
  {file: 'tick.wav', from: 1188, duration: 10, volume: 0.32},
  {file: 'riser.wav', from: 1204, duration: 30, volume: 0.24},
  {file: 'impact.wav', from: 1226, duration: 30, volume: 0.44},
] as const;
