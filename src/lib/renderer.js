import { POSE_CONNECTIONS, PERSON_COLORS, RENDER_CONFIG } from './constants.js';

const FACE_INDICES = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

/**
 * Renders tracked poses on black canvas in neon glow style.
 * Canvas is mirrored horizontally so it feels like a mirror to the user.
 */
export function renderPoses(ctx, trackedPersons, width, height) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  if (trackedPersons.length === 0) return;

  for (const person of trackedPersons) {
    const colors = PERSON_COLORS[person.colorIndex % PERSON_COLORS.length];
    const lm = person.landmarks;
    drawBones(ctx, lm, colors, width, height);
    drawJoints(ctx, lm, colors, width, height);
  }
}

function drawBones(ctx, landmarks, colors, w, h) {
  ctx.lineWidth = RENDER_CONFIG.boneWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = RENDER_CONFIG.glowBlur;
  ctx.strokeStyle = colors.bone;

  for (const [i, j] of POSE_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b) continue;
    if (a.visibility < RENDER_CONFIG.minVisibility || b.visibility < RENDER_CONFIG.minVisibility) continue;

    ctx.beginPath();
    ctx.moveTo(a.x * w, a.y * h);
    ctx.lineTo(b.x * w, b.y * h);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

function drawJoints(ctx, landmarks, colors, w, h) {
  ctx.fillStyle = colors.joint;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = RENDER_CONFIG.glowBlur;

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || lm.visibility < RENDER_CONFIG.minVisibility) continue;

    const r = FACE_INDICES.has(i) ? RENDER_CONFIG.headJointRadius : RENDER_CONFIG.jointRadius;
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

// HUD is rendered as an HTML overlay in App.jsx (not on canvas)
// so it stays readable regardless of canvas CSS transforms
export function renderHUD() {}
