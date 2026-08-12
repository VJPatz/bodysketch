import { useRef, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { TRACKER_CONFIG } from '../lib/constants.js';

export function usePoseLandmarker() {
  const landmarkerRef = useRef(null);
  const lastTimestampRef = useRef(-1);

  const init = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
    );

    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: TRACKER_CONFIG.maxPersons,
      minPoseDetectionConfidence: 0.50,
      minPosePresenceConfidence: 0.50,
      minTrackingConfidence: 0.50,
    });

    landmarkerRef.current = landmarker;
    return landmarker;
  }, []);

  const detect = useCallback((videoEl, timestamp) => {
    if (!landmarkerRef.current) return null;

    if (timestamp <= lastTimestampRef.current) {
      timestamp = lastTimestampRef.current + 1;
    }
    lastTimestampRef.current = timestamp;

    try {
      return landmarkerRef.current.detectForVideo(videoEl, timestamp);
    } catch (e) {
      console.warn('Detection error:', e.message);
      return null;
    }
  }, []);

  const destroy = useCallback(() => {
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
    lastTimestampRef.current = -1;
  }, []);

  return { init, detect, destroy };
}
