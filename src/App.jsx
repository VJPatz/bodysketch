import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePoseLandmarker } from './hooks/usePoseLandmarker';
import { PersonTracker } from './lib/tracker';
import { LandmarkSmoother } from './lib/smoother';
import { renderPoses } from './lib/renderer';
import { PERSON_COLORS } from './lib/constants';
import './styles.css';

const tracker = new PersonTracker();
const smoother = new LandmarkSmoother();

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const fpsRef = useRef({ times: [], value: 0 });
  const trackedCountRef = useRef(0);

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [cameras, setCameras] = useState([]);
  const [trackedCount, setTrackedCount] = useState(0);
  const [fps, setFps] = useState(0);

  const { init, detect, destroy } = usePoseLandmarker();

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !cameraId) {
        setCameraId(videoDevices[0].deviceId);
      }
    });
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const ctx = canvas.getContext('2d');
    const w = video.videoWidth;
    const h = video.videoHeight;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const now = performance.now();
    const result = detect(video, now);

    let currentCount = 0;

    if (result && result.landmarks && result.landmarks.length > 0) {
      const tracked = tracker.update(result.landmarks);
      const smoothed = smoother.smooth(tracked, now);
      smoother.prune(tracker.getActiveIds());
      currentCount = smoothed.length;
      renderPoses(ctx, smoothed, w, h);
    } else {
      tracker.update([]);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    }

    if (trackedCountRef.current !== currentCount) {
      trackedCountRef.current = currentCount;
      setTrackedCount(currentCount);
    }

    const times = fpsRef.current.times;
    times.push(now);
    while (times.length > 0 && times[0] < now - 1000) times.shift();
    const currentFps = times.length;
    if (Math.abs(currentFps - fpsRef.current.value) >= 2) {
      fpsRef.current.value = currentFps;
      setFps(currentFps);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [detect]);

  const startCamera = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMsg('');
      await init();

      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const constraints = {
        video: cameraId
          ? { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : { facingMode: isMobile ? 'user' : 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      tracker.reset();
      smoother.reset();
      setStatus('running');
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to start camera');
      setStatus('error');
    }
  }, [cameraId, init, loop]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    tracker.reset();
    smoother.reset();
    destroy();
    setStatus('idle');
    setTrackedCount(0);
    setFps(0);
    trackedCountRef.current = 0;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [destroy]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      destroy();
    };
  }, [destroy]);

  const isRunning = status === 'running';

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="logo"><span className="logo-icon">◎</span> BodySketch</h1>
          <span className="badge">33-pt</span>
        </div>

        <div className="header-right">
          {isRunning && (
            <div className="hud">
              <span className="hud-fps">{fps} FPS</span>
              {trackedCount > 0 && (
                <div className="legend">
                  {Array.from({ length: Math.min(trackedCount, PERSON_COLORS.length) }, (_, i) => (
                    <span key={i} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: PERSON_COLORS[i].joint }} />
                      <span className="legend-label">P{i + 1}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {cameras.length > 1 && (
            <select
              className="select"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              disabled={isRunning}
            >
              {cameras.map((c, idx) => (
                <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${idx + 1}`}</option>
              ))}
            </select>
          )}

          <button
            className={`btn btn-primary ${isRunning ? 'btn-stop' : ''}`}
            onClick={isRunning ? stopCamera : startCamera}
            disabled={status === 'loading'}
          >
            {isRunning ? '✋ Done' : status === 'loading' ? 'Loading…' : '▶ Play'}
          </button>
        </div>
      </header>

      <div className="viewport">
        <video ref={videoRef} className="video-hidden" playsInline muted />
        <canvas ref={canvasRef} className="pose-canvas" />

        {status === 'idle' && (
          <div className="viewport-empty">
            <p>Hit <strong>Play</strong> and light up 🕺</p>
          </div>
        )}
        {status === 'loading' && (
          <div className="viewport-empty">
            <div className="spinner" />
            <p>Warming up the lights…</p>
          </div>
        )}
        {status === 'error' && (
          <div className="viewport-empty error">
            <p>{errorMsg}</p>
            <button className="btn btn-sm" onClick={() => setStatus('idle')}>Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}
