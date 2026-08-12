
import { TRACKER_CONFIG } from './constants.js';
 
/**
 * PersonTracker — stable ID assignment across frames.
 * Key reliability fix: quality gate rejects noisy partial detections
 * before they enter the tracking pipeline.
 */
export class PersonTracker {
  constructor() {
    this.tracks = new Map();
    this.nextId = 0;
    this.frameCount = 0;
  }
 
  update(poseLandmarks) {
    this.frameCount++;
 
    if (!poseLandmarks || poseLandmarks.length === 0) {
      this._pruneStale();
      return [];
    }
 
    // Quality gate: filter out noisy/partial detections
    const validDetections = [];
    for (let i = 0; i < poseLandmarks.length; i++) {
      const lm = poseLandmarks[i];
      if (this._isValidPose(lm)) {
        validDetections.push({ index: i, landmarks: lm, centroid: this._computeCentroid(lm) });
      }
    }
 
    if (validDetections.length === 0) {
      this._pruneStale();
      return [];
    }
 
    // Greedy nearest-neighbor matching
    const trackIds = [...this.tracks.keys()];
    const matched = new Set();
    const matchedTracks = new Set();
    const assignments = [];
 
    if (trackIds.length > 0) {
      const pairs = [];
      for (const trackId of trackIds) {
        const track = this.tracks.get(trackId);
        for (const det of validDetections) {
          const dist = this._distance(track.centroid, det.centroid);
          if (dist < TRACKER_CONFIG.maxDistance) {
            pairs.push({ trackId, detIndex: det.index, dist });
          }
        }
      }
      pairs.sort((a, b) => a.dist - b.dist);
 
      for (const pair of pairs) {
        if (matchedTracks.has(pair.trackId) || matched.has(pair.detIndex)) continue;
        assignments.push({ trackId: pair.trackId, detectionIndex: pair.detIndex });
        matchedTracks.add(pair.trackId);
        matched.add(pair.detIndex);
      }
    }
 
    // Update matched tracks
    for (const { trackId, detectionIndex } of assignments) {
      const track = this.tracks.get(trackId);
      const det = validDetections.find(d => d.index === detectionIndex);
      track.centroid = det.centroid;
      track.lastSeen = this.frameCount;
    }
 
    // Create new tracks for unmatched detections
    const newAssignments = [];
    for (const det of validDetections) {
      if (matched.has(det.index)) continue;
      const colorIndex = this._getNextColorIndex();
      const id = this.nextId++;
      this.tracks.set(id, {
        centroid: det.centroid,
        lastSeen: this.frameCount,
        colorIndex,
      });
      newAssignments.push({ trackId: id, detectionIndex: det.index });
    }
 
    this._pruneStale();
 
    return [...assignments, ...newAssignments].map(({ trackId, detectionIndex }) => {
      const track = this.tracks.get(trackId);
      if (!track) return null;
      const det = validDetections.find(d => d.index === detectionIndex);
      return { id: trackId, colorIndex: track.colorIndex, landmarks: det.landmarks };
    }).filter(Boolean);
  }
 
  /** Reject detections with too few visible landmarks or missing torso */
  _isValidPose(landmarks) {
    if (!landmarks || landmarks.length < 33) return false;
 
    let visibleCount = 0;
    for (const lm of landmarks) {
      if (lm && lm.visibility > 0.5) visibleCount++;
    }
    if (visibleCount < TRACKER_CONFIG.minVisibleLandmarks) return false;
 
    // Require torso visibility — core body structure
    const torsoIndices = [11, 12, 23, 24];
    let torsoVisible = 0;
    for (const i of torsoIndices) {
      if (landmarks[i] && landmarks[i].visibility > 0.4) torsoVisible++;
    }
    if (torsoVisible < TRACKER_CONFIG.minTorsoVisible) return false;
 
    return true;
  }
 
  _computeCentroid(landmarks) {
    const torsoIndices = [11, 12, 23, 24];
    let cx = 0, cy = 0, count = 0;
 
    for (const i of torsoIndices) {
      if (landmarks[i] && landmarks[i].visibility > 0.3) {
        cx += landmarks[i].x;
        cy += landmarks[i].y;
        count++;
      }
    }
 
    if (count < 2) {
      cx = 0; cy = 0; count = 0;
      for (const lm of landmarks) {
        if (lm.visibility > 0.3) { cx += lm.x; cy += lm.y; count++; }
      }
    }
 
    return count > 0 ? { x: cx / count, y: cy / count } : { x: 0.5, y: 0.5 };
  }
 
  _distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
 
  _getNextColorIndex() {
    for (let i = 0; i < TRACKER_CONFIG.maxPersons; i++) {
      if (!this._isColorInUse(i)) return i;
    }
    return this.nextId % TRACKER_CONFIG.maxPersons;
  }
 
  _isColorInUse(colorIndex) {
    for (const track of this.tracks.values()) {
      if (track.colorIndex === colorIndex) return true;
    }
    return false;
  }
 
  _pruneStale() {
    const staleThreshold = this.frameCount - TRACKER_CONFIG.maxMissedFrames;
    for (const [id, track] of this.tracks.entries()) {
      if (track.lastSeen < staleThreshold) this.tracks.delete(id);
    }
  }
 
  getActiveIds() { return [...this.tracks.keys()]; }
 
  reset() {
    this.tracks.clear();
    this.nextId = 0;
    this.frameCount = 0;
  }
}
 
