import { useEffect, useRef, useState } from 'react';
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, WebGLRenderer } from 'three';
import type { Weather } from '../map/street';
import { finish, prepare } from '../map3d/finish';
import { detective, LOOKS, type Look, type Pose } from '../map3d/figure';
import { buildStreet, type Style, type View } from '../map3d/street3d';

/**
 * /__street, in development only: the 3D street (src/map3d) with every camera, hour, weather and look, to look at and
 * to render the previews in design/sketches/map/3d from (npm run street3d:render). Not a game screen.
 */
export function StreetLab() {
  const ref = useRef<HTMLCanvasElement>(null);
  // Read once: the address only sets where the lab starts.
  const [q] = useState(() => new URLSearchParams(location.search));
  const [view, setView] = useState<View>((q.get('view') as View) ?? 'iso');
  const [hour, setHour] = useState(Number(q.get('hour') ?? 15));
  const [weather, setWeather] = useState<Weather>((q.get('weather') as Weather) ?? 'clear');
  const [walkX, setWalkX] = useState(Number(q.get('x') ?? 300));
  const [style, setStyle] = useState<Style>((q.get('style') as Style) ?? 'village');
  const bare = q.has('bare');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const w = Number(q.get('w') ?? window.innerWidth);
    const h = Number(q.get('h') ?? window.innerHeight);
    const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    prepare(renderer, w, h);
    const { scene, camera } = buildStreet({ view, hour, weather, walkX, aspect: w / h, style });
    // The detective, to choose a look: 1 on the bakery's pavement, or all 3 side by side, each grounded by a soft
    // shadow under the feet, darkest where the soles meet the pavement.
    const figure = q.get('figure');
    if (figure) {
      const looks = figure === 'all' ? LOOKS : ([figure] as Look[]);
      looks.forEach((look, i) => {
        // ?pose=walk&yaw=90 turns 1 figure to be seen from the side, the back, any angle.
        const d = detective(look, (q.get('pose') as Pose) ?? 'stand');
        d.position.set(walkX + (i - (looks.length - 1) / 2) * 9, 0.9, 422);
        d.rotation.y = (Number(q.get('yaw') ?? 0) * Math.PI) / 180;
        scene.add(d);
        const foot = new Mesh(new PlaneGeometry(5.2, 3.4), new MeshBasicMaterial({ map: contact(), transparent: true, depthWrite: false, opacity: 0.85 }));
        foot.rotation.x = -Math.PI / 2;
        foot.position.set(d.position.x, 0.92, 422.4);
        scene.add(foot);
      });
    }
    finish(renderer, scene, camera, style, view, hour, w, h);
    document.body.dataset.ready = `${style}-${view}-${hour}-${weather}-${walkX}`;
    return () => renderer.dispose();
  }, [q, view, hour, weather, walkX, style]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      {!bare && (
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 8, padding: 8, background: 'rgba(255,255,255,0.85)', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          <select value={style} onChange={(e) => setStyle(e.target.value as Style)}>
            {(['village', 'real', 'storybook'] as const).map((v) => <option key={v}>{v}</option>)}
          </select>
          <select value={view} onChange={(e) => setView(e.target.value as View)}>
            {(['iso', 'plan', 'front', 'walk', 'enter', 'figure', 'portrait'] as const).map((v) => <option key={v}>{v}</option>)}
          </select>
          <label>
            Hour <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} /> {hour}
          </label>
          <select value={weather} onChange={(e) => setWeather(e.target.value as Weather)}>
            {(['clear', 'rain', 'fog', 'snow', 'storm', 'flood'] as const).map((v) => <option key={v}>{v}</option>)}
          </select>
          <label>
            Walk <input type="range" min={0} max={1150} value={walkX} onChange={(e) => setWalkX(Number(e.target.value))} />
          </label>
        </div>
      )}
    </div>
  );
}

/** A contact shadow: a soft dark oval, darkest at its middle, the shade under someone standing. */
function contact(): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(20,16,12,0.75)');
  grad.addColorStop(0.45, 'rgba(20,16,12,0.35)');
  grad.addColorStop(1, 'rgba(20,16,12,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(cv);
}
