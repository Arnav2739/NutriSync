import React, { useEffect, useRef } from 'react';

interface PrecomputedTrack {
  id: number;
  path: Path2D;
  speed: number;
  dashPattern: number[];
  offset: number;
  strokeWidth: number;
  color: string;
  railColor: string;
  hasPulse: boolean;
  pulseProgress: number;
  pulseSpeed: number;
  // Curve control points for pulse position calculation
  p0: { x: number; y: number };
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
  p3: { x: number; y: number };
}

export const FlowingLinesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const numTracks = 16;
    let tracks: PrecomputedTrack[] = [];

    // Pre-calculate bezier paths and store them as compiled Path2D objects
    const buildTracks = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const newTracks: PrecomputedTrack[] = [];

      for (let i = 0; i < numTracks; i++) {
        const norm = i / (numTracks - 1);
        const startRatio = 0.32 + norm * 0.46;
        const midRatio = startRatio + 0.12 + Math.sin(norm * Math.PI) * 0.04;
        const endRatio = startRatio + 0.28 + (1 - norm) * 0.08;

        const p0 = { x: -30, y: height * startRatio };
        const cp1 = { x: width * 0.36, y: height * midRatio };
        const cp2 = { x: width * 0.68, y: height * (endRatio - 0.12) };
        const p3 = { x: width + 40, y: height * endRatio };

        // Precompile geometry into a hardware-accelerated Path2D object
        const path = new Path2D();
        path.moveTo(p0.x, p0.y);
        path.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y);

        const speed = 0.75 + (i % 4) * 0.25;

        const dashPatterns = [
          [180, 240, 80, 200],
          [240, 320, 120, 260],
          [140, 180, 60, 220],
          [300, 400, 100, 280],
          [110, 200, 90, 190],
        ];
        const dashPattern = dashPatterns[i % dashPatterns.length];

        const isAccent = i === 3 || i === 8 || i === 12;
        const color = isAccent
          ? 'rgba(203, 237, 62, 0.65)'
          : `rgba(235, 245, 240, ${0.45 + (i % 3) * 0.18})`;
        const railColor = isAccent
          ? 'rgba(203, 237, 62, 0.09)'
          : 'rgba(235, 245, 240, 0.055)';

        newTracks.push({
          id: i,
          path,
          speed,
          dashPattern,
          offset: (i * 95) % 1000,
          strokeWidth: isAccent ? 1.8 : 1.3,
          color,
          railColor,
          hasPulse: i % 4 === 1,
          pulseProgress: (i * 0.22) % 1,
          pulseSpeed: 0.0016 + (i % 3) * 0.0005,
          p0,
          cp1,
          cp2,
          p3,
        });
      }

      tracks = newTracks;
    };

    buildTracks();

    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(buildTracks, 120);
    };
    window.addEventListener('resize', handleResize);

    // Fast cubic bezier point evaluation
    const getBezierPoint = (
      p0: { x: number; y: number },
      cp1: { x: number; y: number },
      cp2: { x: number; y: number },
      p3: { x: number; y: number },
      t: number
    ) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      return {
        x: uuu * p0.x + 3 * uu * t * cp1.x + 3 * u * tt * cp2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * cp1.y + 3 * u * tt * cp2.y + ttt * p3.y,
      };
    };

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
      if (isVisible) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isVisible) return;

      const dt = Math.min((time - lastTime) / 16.667, 2.0);
      lastTime = time;

      // Ultra-fast clearRect: zero allocations per frame
      ctx.clearRect(0, 0, width, height);

      // Phase 1: Draw faint guide rails in batch
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        ctx.strokeStyle = track.railColor;
        ctx.stroke(track.path);
      }

      // Phase 2: Draw flowing dashed streamlines
      ctx.lineCap = 'round';

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        track.offset += track.speed * dt;

        ctx.lineWidth = track.strokeWidth;
        ctx.strokeStyle = track.color;
        ctx.setLineDash(track.dashPattern);
        ctx.lineDashOffset = -track.offset;
        ctx.stroke(track.path);

        // Phase 3: Draw pulse point without expensive context shadowBlur
        if (track.hasPulse) {
          track.pulseProgress = (track.pulseProgress + track.pulseSpeed * dt) % 1;
          const pos = getBezierPoint(track.p0, track.cp1, track.cp2, track.p3, track.pulseProgress);

          // Outer luminous halo
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(203, 237, 62, 0.22)';
          ctx.fill();

          // Bright center core
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="flowing-lines-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        contain: 'strict',
      }}
    />
  );
};

export default FlowingLinesBackground;
