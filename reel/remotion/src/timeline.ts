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
export const TOTAL = 1360;

export const SCENES = {
  hook: {from: 0, duration: 186, trimBefore: 0, playbackRate: 0.75},
  talk: {from: 172, duration: 158, trimBefore: 140, playbackRate: 0.88},
  hadith: {from: 316, duration: 430, trimBefore: 279, playbackRate: 0.703},
  reflection: {from: 732, duration: 176, trimBefore: 581, playbackRate: 0.93},
  tongue: {from: 894, duration: 118, trimBefore: 745, playbackRate: 0.5},
  final: {from: 998, duration: 290, trimBefore: 804, playbackRate: 0.33},
  end: {from: 1268, duration: 92},
} as const;

// Narration, cut to land inside the scene it belongs to.
export const VOICE = [
  {file: 'voice01.mp3', from: 0, duration: 118},
  {file: 'voice02.mp3', from: 112, duration: 84},
  {file: 'voice03.mp3', from: 200, duration: 138},
  // The three hadith lines are slowed to 0.94x in the build, so they land
  // calmer and slightly slower than the rest of the narration.
  {file: 'voice10.mp3', from: 352, duration: 106},
  {file: 'voice15.mp3', from: 466, duration: 82},
  {file: 'voice05.mp3', from: 556, duration: 198},
  {file: 'voice06.mp3', from: 752, duration: 150},
  {file: 'voice12.mp3', from: 912, duration: 90},
  {file: 'voice13.mp3', from: 1015, duration: 205},
  {file: 'voice14.mp3', from: 1226, duration: 73},
  {file: 'voice09.mp3', from: 1306, duration: 39},
] as const;

// Sound design. No music anywhere - these are all noise/impulse based effects.
export const SFX = [
  {file: 'impact.wav', from: 0, duration: 34, volume: 0.5},
  {file: 'cloth.wav', from: 70, duration: 14, volume: 0.32},
  {file: 'whoosh.wav', from: 166, duration: 20, volume: 0.3},
  {file: 'cloth.wav', from: 240, duration: 14, volume: 0.28},
  {file: 'riser.wav', from: 292, duration: 35, volume: 0.26},
  {file: 'impact.wav', from: 314, duration: 34, volume: 0.42},
  {file: 'tick.wav', from: 470, duration: 8, volume: 0.3},
  {file: 'tick.wav', from: 620, duration: 8, volume: 0.28},
  {file: 'whoosh.wav', from: 724, duration: 20, volume: 0.24},
  {file: 'cloth.wav', from: 786, duration: 14, volume: 0.28},
  {file: 'whoosh.wav', from: 890, duration: 20, volume: 0.24},
  {file: 'impact.wav', from: 902, duration: 34, volume: 0.3},
  {file: 'whoosh.wav', from: 994, duration: 20, volume: 0.26},
  {file: 'tick.wav', from: 1228, duration: 8, volume: 0.32},
  {file: 'riser.wav', from: 1244, duration: 35, volume: 0.24},
  {file: 'impact.wav', from: 1266, duration: 34, volume: 0.44},
] as const;
