// MediaPipe Pose 33 landmark connections
export const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

// Neon colors for black background
export const PERSON_COLORS = [
  { joint: '#00f0ff', bone: 'rgba(0, 240, 255, 0.85)', glow: '#00f0ff' },
  { joint: '#ff2ee6', bone: 'rgba(255, 46, 230, 0.85)', glow: '#ff2ee6' },
  { joint: '#39ff6a', bone: 'rgba(57, 255, 106, 0.85)', glow: '#39ff6a' },
  { joint: '#ffe600', bone: 'rgba(255, 230, 0, 0.85)', glow: '#ffe600' },
];

export const RENDER_CONFIG = {
  jointRadius: 5,
  boneWidth: 3,
  minVisibility: 0.45,
  headJointRadius: 3,
  glowBlur: 14,
};

export const TRACKER_CONFIG = {
  maxDistance: 0.35,
  maxMissedFrames: 20,
  maxPersons: 4,
  minVisibleLandmarks: 8,
  minTorsoVisible: 2,
};


export const SMOOTHING_CONFIG = {
  frequency: 30,
  minCutoff: 1.0,
  beta: 0.007,
  dCutoff: 1.0,
};
