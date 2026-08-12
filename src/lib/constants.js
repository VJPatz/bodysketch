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

// Colors for white background
export const PERSON_COLORS = [
  { joint: '#1a1a2e', bone: 'rgba(26, 26, 46, 0.6)' },
  { joint: '#e63946', bone: 'rgba(230, 57, 70, 0.5)' },
  { joint: '#2a9d8f', bone: 'rgba(42, 157, 143, 0.5)' },
  { joint: '#e76f51', bone: 'rgba(231, 111, 81, 0.5)' },
];

export const RENDER_CONFIG = {
  jointRadius: 5,
  boneWidth: 3,
  minVisibility: 0.45,
  headJointRadius: 3,
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
