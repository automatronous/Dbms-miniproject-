import { useEffect, useRef } from 'react';

const defaults = {
  screen_width_m: 15.24,
  screen_height_m: 8.57,
  screen_bottom_m: 1.2,
  front_row_distance_m: 12,
  seat_pitch_m: 0.62,
  seat_width_m: 0.55,
  row_pitch_m: 1.35,
  row_rise_m: 0.22,
  eye_height_m: 1.12,
};
const radians = degrees => degrees * Math.PI / 180;
const EMPTY_POSTER_FALLBACKS = [];
const posterPlaceholder = title => {
  const label = String(title || 'Movie').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#69404d"/><stop offset=".55" stop-color="#302630"/><stop offset="1" stop-color="#17151b"/></linearGradient><radialGradient id="r"><stop stop-color="#d7b477" stop-opacity=".34"/><stop offset="1" stop-color="#d7b477" stop-opacity="0"/></radialGradient></defs><path fill="url(#g)" d="M0 0h600v900H0z"/><circle cx="300" cy="330" r="310" fill="url(#r)"/><path d="M52 670h496M52 700h496" stroke="#e8d2a5" stroke-opacity=".45"/><text x="300" y="755" fill="#f8f3ea" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="700">${label.slice(0, 28)}</text><text x="300" y="810" fill="#d7b477" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" letter-spacing="6">SHOWTIME · CINEMA</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
const clean = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function unit(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map(value => value / length);
}
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function mix(a, b, t) { return Array.isArray(a) ? a.map((value, index) => value + (b[index] - value) * t) : a + (b - a) * t; }

function seatPosition(seat, rows, allSeats, geometry) {
  const rowIndex = Math.max(0, rows.findIndex(row => String(row).trim().toUpperCase() === String(seat.row_label).trim().toUpperCase()));
  const maxNumber = Math.max(1, ...allSeats.map(item => Number(item.seat_number) || 1));
  return {
    x: ((Number(seat.seat_number) || 1) - (maxNumber + 1) / 2) * geometry.seat_pitch_m,
    y: geometry.eye_height_m + rowIndex * geometry.row_rise_m,
    z: geometry.front_row_distance_m + rowIndex * geometry.row_pitch_m,
    rowIndex,
  };
}

function solveAffine(source, destination) {
  const [[x1, y1], [x2, y2], [x3, y3]] = source;
  const [[u1, v1], [u2, v2], [u3, v3]] = destination;
  const det = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
  if (Math.abs(det) < 1e-7) return null;
  const solve = (q1, q2, q3) => [
    (q1 * (y2 - y3) + q2 * (y3 - y1) + q3 * (y1 - y2)) / det,
    (q1 * (x3 - x2) + q2 * (x1 - x3) + q3 * (x2 - x1)) / det,
    (q1 * (x2 * y3 - x3 * y2) + q2 * (x3 * y1 - x1 * y3) + q3 * (x1 * y2 - x2 * y1)) / det,
  ];
  const [a, c, e] = solve(u1, u2, u3);
  const [b, d, f] = solve(v1, v2, v3);
  return [a, b, c, d, e, f];
}

function paintImageTriangle(ctx, image, sourcePoints, destPoints) {
  const matrix = solveAffine(sourcePoints, destPoints);
  if (!matrix) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(destPoints[0][0], destPoints[0][1]);
  ctx.lineTo(destPoints[1][0], destPoints[1][1]);
  ctx.lineTo(destPoints[2][0], destPoints[2][1]);
  ctx.closePath();
  ctx.clip();
  ctx.transform(...matrix);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function CinemaPOV({ seats, selectedSeat, screen, movieTitle, poster, posterFallbacks = EMPTY_POSTER_FALLBACKS, screenImage, selectedCount = 1 }) {
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const posterRef = useRef(null);
  const redrawRef = useRef(null);
  const viewRef = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  const dragRef = useRef(null);
  const geometry = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, clean(screen?.[key], fallback)]));
  const rows = [...new Set(seats.map(seat => seat.row_label))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const centerRow = rows[Math.floor(Math.max(0, rows.length - 1) / 2)];
  const centerNumber = Math.round((Math.max(1, ...seats.map(seat => Number(seat.seat_number) || 1)) + 1) / 2);
  const cameraSeat = selectedSeat || seats.find(seat => seat.row_label === centerRow && Number(seat.seat_number) === centerNumber) || seats[0];
  const target = cameraSeat ? seatPosition(cameraSeat, rows, seats, geometry) : { x: 0, y: geometry.eye_height_m, z: geometry.front_row_distance_m, rowIndex: 0 };
  const width = clean(geometry.screen_width_m, 8);
  const screenHeight = clean(geometry.screen_height_m, 4.32);
  // Show the advertised auditorium screen size as one familiar figure.
  const screenSizeFt = screen?.screen_size_ft ?? (screen?.screen_width_m ? Number(screen.screen_width_m) * 3.28084 : null);
  const screenBottom = clean(geometry.screen_bottom_m, 1.2);

  useEffect(() => {
    // Never leave the previous movie on screen while the newly selected film loads.
    posterRef.current = null;
    redrawRef.current?.();
    const sources = [...new Set([screenImage, poster, ...posterFallbacks].filter(Boolean))];
    if (!sources.length) { posterRef.current = null; return; }
    const image = new Image();
    image.referrerPolicy = "no-referrer";
    let sourceIndex = 0, usingPlaceholder = false;
    image.onload = () => {
      const aspect=width/screenHeight, frame=document.createElement('canvas');
      frame.width=1280;frame.height=Math.round(frame.width/aspect);
      const paint=frame.getContext('2d');
      // Fill the widescreen frame with a softly blurred, aspect-cropped backdrop;
      // keep the complete sharp portrait poster centered at its native ratio.
      const cover=Math.max(frame.width/image.naturalWidth,frame.height/image.naturalHeight);
      const cropWidth=frame.width/cover,cropHeight=frame.height/cover;
      paint.filter='blur(22px) brightness(.5) saturate(1.12)';
      paint.drawImage(image,(image.naturalWidth-cropWidth)/2,(image.naturalHeight-cropHeight)/2,cropWidth,cropHeight,0,0,frame.width,frame.height);
      paint.filter='none';
      paint.fillStyle='#05050630';paint.fillRect(0,0,frame.width,frame.height);
      const contain=Math.min(frame.width/image.naturalWidth,frame.height/image.naturalHeight),drawWidth=image.naturalWidth*contain,drawHeight=image.naturalHeight*contain;
      paint.filter='contrast(1.06) saturate(1.08) brightness(.98)';paint.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,(frame.width-drawWidth)/2,(frame.height-drawHeight)/2,drawWidth,drawHeight);paint.filter='none';
      posterRef.current=frame;redrawRef.current?.();
    };
    image.onerror = () => {
      sourceIndex += 1;
      if (sourceIndex < sources.length) image.src = sources[sourceIndex];
      else if (!usingPlaceholder) { usingPlaceholder = true; image.src = posterPlaceholder(movieTitle); }
      else { posterRef.current = null; redrawRef.current?.(); }
    };
    image.src = sources[sourceIndex];
    return () => { image.onload = null; image.onerror = null; };
  }, [poster, posterFallbacks, screenImage, width, screenHeight, movieTitle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    // Begin above and behind the selected seat, then fly down to that exact
    // seat's position. The origin follows its row instead of a fixed front row.
    const current = cameraRef.current || { x: target.x, y: target.y + 10, z: target.z };
    const from = { ...current };
    const to = { x: target.x, y: target.y, z: target.z };
    cameraRef.current = current;
    const startedAt = performance.now();
    const duration = 1750;
    let raf = 0;
    let widthPx = 0, heightPx = 0, pixelWidth = 0, pixelHeight = 0, dpr = 1;
    const roomRows = rows;
    const allSeats = seats;
    const viewWidth = Math.max(width + 3, (Math.max(1, ...allSeats.map(seat => Number(seat.seat_number) || 1)) * geometry.seat_pitch_m) + 2.4);
    const roomDepth = geometry.front_row_distance_m + Math.max(0, roomRows.length - 1) * geometry.row_pitch_m + 2.2;
    const roomHeight = screenBottom + screenHeight + 1.1;

    const project = (point, camera) => {
      const cameraPoint = [camera.x, camera.y, camera.z];
      // Each seat aims toward the physical screen center. Perspective size and
      // viewing angle then follow from that seat's measured x/y/z position.
      const baseForward = unit(sub([0, screenBottom + screenHeight * .5, 0], cameraPoint));
      const baseRight = unit(cross(baseForward, [0, 1, 0]));
      const baseUp = unit(cross(baseRight, baseForward));
      const view = viewRef.current;
      const forward = unit(add(add(baseForward, baseRight.map(value => value * Math.tan(view.yaw))), baseUp.map(value => value * Math.tan(view.pitch))));
      const right = unit(cross(forward, [0, 1, 0]));
      const up = unit(cross(right, forward));
      const delta = sub(point, cameraPoint);
      const z = dot(delta, forward);
      if (z <= .08) return null;
      const fov = radians(clamp(((widthPx < heightPx ? 68 : 72) + (camera.fovBoost || 0)) / view.zoom, 32, 105));
      const focal = widthPx / (2 * Math.tan(fov / 2));
      const output = [widthPx / 2 + focal * dot(delta, right) / z, heightPx * .51 - focal * dot(delta, up) / z, z];
      return output;
    };

    const polygon = (points, fill, camera, alpha = 1) => {
      const projected = points.map(point => project(point, camera));
      if (projected.some(point => !point)) return;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(projected[0][0], projected[0][1]);
      for (const point of projected.slice(1)) ctx.lineTo(point[0], point[1]);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.globalAlpha = 1;
      return projected;
    };

    const speakerDisc = (center, radius, camera, fill, orientation = 'front') => {
      const origin = project(center, camera);
      const edgeX = orientation === 'front'
        ? project([center[0] + radius, center[1], center[2]], camera)
        : project([center[0], center[1], center[2] + radius], camera);
      const edgeY = project([center[0], center[1] + radius, center[2]], camera);
      if (!origin || !edgeX || !edgeY) return;
      ctx.beginPath();
      ctx.ellipse(origin[0], origin[1], Math.hypot(edgeX[0] - origin[0], edgeX[1] - origin[1]), Math.hypot(edgeY[0] - origin[0], edgeY[1] - origin[1]), 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const warmGlow = (center, radius, camera, strength = .12) => {
      const origin = project(center, camera);
      const edge = project([center[0] + radius, center[1], center[2]], camera);
      if (!origin || !edge) return;
      const glowRadius = Math.max(5, Math.hypot(edge[0] - origin[0], edge[1] - origin[1]));
      const glow = ctx.createRadialGradient(origin[0], origin[1], 0, origin[0], origin[1], glowRadius);
      glow.addColorStop(0, `rgba(244, 207, 137, ${strength})`);
      glow.addColorStop(.38, `rgba(229, 190, 118, ${strength * .44})`);
      glow.addColorStop(1, 'rgba(229, 190, 118, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(origin[0] - glowRadius, origin[1] - glowRadius, glowRadius * 2, glowRadius * 2);
    };

    const render = now => {
      try {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) { raf = requestAnimationFrame(render); return; }
      dpr = Math.min(2, window.devicePixelRatio || 1);
      if (Math.round(rect.width * dpr) !== pixelWidth || Math.round(rect.height * dpr) !== pixelHeight) {
        pixelWidth = Math.round(rect.width * dpr); pixelHeight = Math.round(rect.height * dpr);
        canvas.width = pixelWidth; canvas.height = pixelHeight;
      }
      widthPx = rect.width; heightPx = rect.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
      const altitude = Math.max(from.y, to.y) + 4;
      const lift = { x: from.x, y: altitude, z: from.z + 1.6 };
      const cruise = { x: to.x, y: altitude, z: to.z + 1.6 };
      let camera;
      if (progress < .24) camera = { x: mix(from.x, lift.x, smooth(progress / .24)), y: mix(from.y, lift.y, smooth(progress / .24)), z: mix(from.z, lift.z, smooth(progress / .24)) };
      else if (progress < .72) camera = { x: mix(lift.x, cruise.x, smooth((progress - .24) / .48)), y: mix(lift.y, cruise.y, smooth((progress - .24) / .48)), z: mix(lift.z, cruise.z, smooth((progress - .24) / .48)) };
      else camera = { x: mix(cruise.x, to.x, smooth((progress - .72) / .28)), y: mix(cruise.y, to.y, smooth((progress - .72) / .28)), z: mix(cruise.z, to.z, smooth((progress - .72) / .28)) };
      camera.fovBoost = 15 * Math.sin(Math.PI * progress);
      cameraRef.current = camera;

      const sky = ctx.createLinearGradient(0, 0, 0, heightPx);
      sky.addColorStop(0, '#151518'); sky.addColorStop(.58, '#202023'); sky.addColorStop(1, '#0c0c0f');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, widthPx, heightPx);
            const half = viewWidth / 2;
      const faces = [
        { points: [[-half, 0, 0], [half, 0, 0], [half, 0, roomDepth], [-half, 0, roomDepth]], fill: '#242427', name: 'floor' },
        { points: [[-half, roomHeight, 0], [half, roomHeight, 0], [half, roomHeight, roomDepth], [-half, roomHeight, roomDepth]], fill: '#151518', name: 'ceiling' },
        { points: [[-half, 0, 0], [-half, roomHeight, 0], [-half, roomHeight, roomDepth], [-half, 0, roomDepth]], fill: '#242427', name: 'left-wall' },
        { points: [[half, 0, 0], [half, 0, roomDepth], [half, roomHeight, roomDepth], [half, roomHeight, 0]], fill: '#202023', name: 'right-wall' },
        { points: [[-half, 0, roomDepth], [half, 0, roomDepth], [half, roomHeight, roomDepth], [-half, roomHeight, roomDepth]], fill: '#1e1e21', name: 'back-wall' },
        { points: [[-half, 0, 0], [half, 0, 0], [half, roomHeight, 0], [-half, roomHeight, 0]], fill: '#202023', name: 'front-wall' },
      ];
      faces.sort((a, b) => {
        const depth = face => face.points.reduce((sum, point) => sum + Math.hypot(point[0] - camera.x, point[1] - camera.y, point[2] - camera.z), 0) / face.points.length;
        return depth(b) - depth(a);
      });
      faces.filter(face => face.name !== 'ceiling' || camera.y < roomHeight * .88).forEach(face => polygon(face.points, face.fill, camera));

      // A low, stepped auditorium floor and center aisle make the room read like
      // a sloped cinema rather than a plain rectangular box.
      for (let rowIndex = 0; rowIndex < roomRows.length; rowIndex += 1) {
        const z = geometry.front_row_distance_m + rowIndex * geometry.row_pitch_m - .28;
        const rise = rowIndex * geometry.row_rise_m;
        const stepLeft = [-half + .16, rise + .035, z];
        const stepRight = [half - .16, rise + .035, z];
        polygon([stepLeft, stepRight, [half - .16, rise + .035, z + .12], [-half + .16, rise + .035, z + .12]], '#29292d', camera, .72);
        polygon([[-half + .16, rise + .035, z], [half - .16, rise + .035, z], [half - .16, rise + .17, z], [-half + .16, rise + .17, z]], '#111114', camera, .78);
        // Small reflective aisle markers use neutral white, never a colored glow.
        for (const side of [-1, 1]) {
          const markerX = side * (half - .235);
          polygon([[side * (half - .28), rise + .19, z + .025], [side * (half - .19), rise + .19, z + .025], [side * (half - .19), rise + .21, z + .055], [side * (half - .28), rise + .21, z + .055]], '#e2c786', camera, .42);
          warmGlow([markerX, rise + .21, z + .04], .52, camera, .075);
        }
      }

      // Low aisle markers and layered acoustic wall detailing add auditorium scale.
      for (const side of [-1, 1]) {
        const x = side * (half - .42);
        polygon([[x, .38, .4], [x, .56, .4], [x, .56, roomDepth - .3], [x, .38, roomDepth - .3]], '#8f8f94', camera, .55);
        // Repeated recessed acoustic panels with raised ribs replace flat side walls.
        for (let i = 0; i < roomDepth - 1; i += 1.65) {
          const wallX = side * (half - .055);
          polygon([[wallX, .72, i + .48], [wallX, 3.12, i + .48], [wallX, 3.12, i + 1.38], [wallX, .72, i + 1.38]], '#303034', camera, .7);
          polygon([[wallX - side * .012, .84, i + .57], [wallX - side * .012, 2.94, i + .57], [wallX - side * .012, 2.94, i + 1.28], [wallX - side * .012, .84, i + 1.28]], '#252529', camera, .65);
          for (const ribZ of [i + .53, i + 1.32]) polygon([[wallX - side * .026, .72, ribZ], [wallX - side * .026, 3.12, ribZ], [wallX, 3.12, ribZ], [wallX, .72, ribZ]], '#68686d', camera, .27);
          polygon([[wallX - side * .028, 3.14, i + .46], [wallX - side * .028, 3.2, i + .46], [wallX - side * .028, 3.2, i + 1.4], [wallX - side * .028, 3.14, i + 1.4]], '#8d8d91', camera, .28);
          // Quiet monochrome wall sconces are set between surround speakers.
          const lightZ = i + .88;
          polygon([[wallX - side * .04, 2.38, lightZ - .09], [wallX - side * .04, 2.82, lightZ - .09], [wallX - side * .04, 2.82, lightZ + .09], [wallX - side * .04, 2.38, lightZ + .09]], '#111114', camera, .92);
          polygon([[wallX - side * .045, 2.43, lightZ - .035], [wallX - side * .045, 2.77, lightZ - .035], [wallX - side * .045, 2.77, lightZ + .035], [wallX - side * .045, 2.43, lightZ + .035]], '#e3c789', camera, .34);
          warmGlow([wallX - side * .052, 2.6, lightZ], .86, camera, .115);
        }
      }

      // Recessed ceiling channels and cross ribs appear naturally when the camera pans upward.
      const ceilingY = roomHeight - .07;
      for (const x of [-1.35, 1.35]) {
        polygon([[x - .035, ceilingY, .35], [x + .035, ceilingY, .35], [x + .035, ceilingY, roomDepth - .25], [x - .035, ceilingY, roomDepth - .25]], '#b7b7bb', camera, .28);
      }
      for (let z = .9; z < roomDepth; z += 2.5) {
        polygon([[-half + .2, ceilingY, z], [half - .2, ceilingY, z], [half - .2, ceilingY - .12, z + .1], [-half + .2, ceilingY - .12, z + .1]], '#09090b', camera, .72);
      }

      // Front L/R cinema channels sit symmetrically just outside the image plane.
      for (const side of [-1, 1]) {
        const speakerX = side * (width / 2 + .18);
        const speakerTop = screenBottom + screenHeight * .84;
        const speakerBottom = screenBottom + .36;
        const x1 = speakerX - .17, x2 = speakerX + .17, zFront = -.045, zSide = .12;
        polygon([[x1,speakerBottom,zFront],[x2,speakerBottom,zFront],[x2,speakerTop,zFront],[x1,speakerTop,zFront]], '#09090c', camera);
        polygon([[x2,speakerBottom,zFront],[x2,speakerBottom,zSide],[x2,speakerTop,zSide],[x2,speakerTop,zFront]], '#26262b', camera);
        for (const [y, radius] of [[speakerBottom + .38,.085],[speakerBottom + .91,.12],[speakerBottom + 1.58,.085],[speakerBottom + 2.15,.12]]) {
          speakerDisc([speakerX,y,-.045],radius,camera,'#414147');
          speakerDisc([speakerX,y,-.05],radius*.56,camera,'#17171b');
          speakerDisc([speakerX,y,-.055],radius*.2,camera,'#77777e');
        }
      }

      // Surround speakers are mounted in evenly spaced pairs along the side walls,
      // with their cones facing inward toward the audience.
      for (const side of [-1, 1]) {
        const wallX = side * (half - .09);
        for (const z of [roomDepth * .31, roomDepth * .53, roomDepth * .75]) {
          const cabinetX = wallX - side * .075;
          polygon([[cabinetX, 1.72, z - .13], [cabinetX, 2.28, z - .13], [cabinetX, 2.28, z + .13], [cabinetX, 1.72, z + .13]], '#101013', camera, .96);
          speakerDisc([cabinetX - side * .008, 1.91, z], .11, camera, '#444449', 'side');
          speakerDisc([cabinetX - side * .012, 1.91, z], .055, camera, '#19191d', 'side');
          speakerDisc([cabinetX - side * .016, 1.91, z], .018, camera, '#77777c', 'side');
        }
      }
      const centerY = screenBottom - .16;
      polygon([[-.72,centerY-.12,-.04],[.72,centerY-.12,-.04],[.72,centerY+.12,-.04],[-.72,centerY+.12,-.04]], '#16161a', camera);
      for (const x of [-.43,0,.43]) speakerDisc([x,centerY,-.05],.075,camera,'#65656a');

      // A matte screen surround and acoustic fascia frame the projection wall.
      const frameTop = screenBottom + screenHeight;
      const frameBottom = screenBottom;
      const frameLeft = -width / 2 - .2, frameRight = width / 2 + .2;
      polygon([[frameLeft, frameBottom - .16, .012], [frameRight, frameBottom - .16, .012], [frameRight, frameBottom, .012], [frameLeft, frameBottom, .012]], '#09090b', camera);
      polygon([[frameLeft, frameTop, .012], [frameRight, frameTop, .012], [frameRight, frameTop + .15, .012], [frameLeft, frameTop + .15, .012]], '#111114', camera);
      polygon([[frameLeft, frameBottom, .012], [-width / 2, frameBottom, .012], [-width / 2, frameTop, .012], [frameLeft, frameTop, .012]], '#151518', camera);
      polygon([[width / 2, frameBottom, .012], [frameRight, frameBottom, .012], [frameRight, frameTop, .012], [width / 2, frameTop, .012]], '#151518', camera);
      polygon([[frameLeft, frameTop + .16, .008], [frameRight, frameTop + .16, .008], [frameRight, frameTop + .28, .008], [frameLeft, frameTop + .28, .008]], '#252529', camera, .92);

      // Screen is a measured plane at the auditorium's front wall, with the current movie as its image.
      const screenPoints = [
        [-width / 2, screenBottom + screenHeight, .035], [width / 2, screenBottom + screenHeight, .035],
        [width / 2, screenBottom, .035], [-width / 2, screenBottom, .035],
      ];
      const projectedScreen = screenPoints.map(point => project(point, camera));
      if (projectedScreen.every(Boolean)) {
        const screen2d = projectedScreen.map(point => point.slice(0, 2));
        polygon(screenPoints, '#dedee0', camera);
        const image = posterRef.current;
        if (image?.width && image?.height) {
          const sw = image.width, sh = image.height;
          const columns = 16, rows = 9;
          const destination = (u, v) => {
            const top = mix(screenPoints[0], screenPoints[1], u);
            const bottom = mix(screenPoints[3], screenPoints[2], u);
            return project(mix(top, bottom, v), camera)?.slice(0, 2);
          };
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(screen2d[0][0], screen2d[0][1]);
          for (const point of screen2d.slice(1)) ctx.lineTo(point[0], point[1]);
          ctx.closePath();
          ctx.clip();
          const bleed = triangle => {
            const cx = triangle.reduce((sum, point) => sum + point[0], 0) / 3;
            const cy = triangle.reduce((sum, point) => sum + point[1], 0) / 3;
            return triangle.map(([x, y]) => {
              const length = Math.hypot(x - cx, y - cy) || 1;
              return [x + (x - cx) / length * .7, y + (y - cy) / length * .7];
            });
          };
          for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
            const u0 = column / columns, u1 = (column + 1) / columns;
            const v0 = row / rows, v1 = (row + 1) / rows;
            const a = destination(u0, v0), b = destination(u1, v0), c = destination(u1, v1), d = destination(u0, v1);
            if (!a || !b || !c || !d) continue;
            const sa = [u0 * sw, v0 * sh], sb = [u1 * sw, v0 * sh];
            const sc = [u1 * sw, v1 * sh], sd = [u0 * sw, v1 * sh];
            // Small perspective-corrected tiles prevent the poster from twisting
            // across the projected screen quadrilateral.
            paintImageTriangle(ctx, image, [sa, sb, sc], bleed([a, b, c]));
            paintImageTriangle(ctx, image, [sa, sc, sd], bleed([a, c, d]));
          }
          ctx.restore();
          polygon(screenPoints, '#101012', camera, .06);
        } else {
          polygon(screenPoints, '#d5d5d8', camera);
          const center = project([0, screenBottom + screenHeight / 2, 0], camera);
          if (center) {
            ctx.save(); ctx.fillStyle = '#332431'; ctx.textAlign = 'center';
            ctx.font = `600 ${clamp(widthPx * .025, 11, 25)}px Manrope, sans-serif`;
            ctx.fillText(movieTitle || 'NOW SHOWING', center[0], center[1], widthPx * .58);
            ctx.restore();
          }
        }
      }

      // Keep the auditorium seats visible during the overhead flight, then
      // fade them out before the camera reaches the selected seat's clear POV.
      const flightSeatVisibility = 1 - smooth((progress - .38) / .52);
      const downwardPanVisibility = smooth((-viewRef.current.pitch - .025) / .2) * .96;
      const seatVisibility = Math.max(flightSeatVisibility, progress >= 1 ? downwardPanVisibility : 0);
      if (seatVisibility > .01) {
        for (const seat of allSeats) {
          const position = seatPosition(seat, roomRows, allSeats, geometry);
          const floor = .34 + position.rowIndex * geometry.row_rise_m;
          const seatWidth = Math.min(geometry.seat_width_m, geometry.seat_pitch_m * .9) * .76;
          const x1 = position.x - seatWidth * .47;
          const x2 = position.x + seatWidth * .47;
          const front = position.z - .16;
          const back = position.z + .15;
          const backColor = seat.booked ? '#17171b' : seat.type === 'Premium' ? '#29292f' : '#222227';
          // Padded back, visible from the rear of the auditorium.
          polygon([[x1,floor+.36,back],[x2,floor+.36,back],[x2,floor+.91,back],[x1,floor+.91,back]], backColor, camera, seatVisibility);
          polygon([[x1+.045,floor+.43,back+.006],[x2-.045,floor+.43,back+.006],[x2-.045,floor+.82,back+.006],[x1+.045,floor+.82,back+.006]], '#34343a', camera, seatVisibility);
          // Seat cushion and two short arm rests read clearly in the aerial view.
          polygon([[x1,floor+.36,front],[x2,floor+.36,front],[x2,floor+.36,back],[x1,floor+.36,back]], '#303036', camera, seatVisibility);
          for (const side of [-1,1]) {
            const armX = position.x + side * seatWidth * .55;
            polygon([[armX-.025,floor+.43,front],[armX+.025,floor+.43,front],[armX+.025,floor+.5,back],[armX-.025,floor+.5,back]], '#29292e', camera, seatVisibility);
          }
        }
      }

      // Keep the fly-in cinematic with a soft monochrome edge bloom, never wireframe rays.
      const flight = Math.sin(Math.PI * progress);
      if (flight > .01) {
        const bloom = ctx.createRadialGradient(widthPx * .5, heightPx * .48, Math.min(widthPx, heightPx) * .24, widthPx * .5, heightPx * .48, Math.max(widthPx, heightPx) * .78);
        bloom.addColorStop(0, `rgba(255,255,255,${.015 * flight})`);
        bloom.addColorStop(1, `rgba(255,255,255,${.085 * flight})`);
        ctx.fillStyle = bloom; ctx.fillRect(0, 0, widthPx, heightPx);
      }
      const vignette = ctx.createRadialGradient(widthPx * .5, heightPx * .48, Math.min(widthPx, heightPx) * .2, widthPx * .5, heightPx * .48, Math.max(widthPx, heightPx) * .7);
      vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#09090bcf');
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, widthPx, heightPx);
      if (progress < 1) raf = requestAnimationFrame(render);
      } catch (error) {
        canvas.setAttribute('data-pov-error', 'true');
        ctx.fillStyle = '#f3f3f3'; ctx.font = '14px sans-serif'; ctx.fillText('Seat view could not be rendered', 16, 30);
      }
    };

    raf = requestAnimationFrame(render);
    redrawRef.current = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
    const resize = new ResizeObserver(() => { pixelWidth = 0; pixelHeight = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(render); });
    resize.observe(canvas);
    return () => { cancelAnimationFrame(raf); resize.disconnect(); redrawRef.current = null; };
  }, [target.x, target.y, target.z, seats, screen, poster, movieTitle]);

  const selectedLabel = cameraSeat ? `${cameraSeat.row_label}${cameraSeat.seat_number}` : '—';
  const handlePointerDown = event => {
    if (event.button !== 0) return;
    dragRef.current = { x: event.clientX, y: event.clientY, yaw: viewRef.current.yaw, pitch: viewRef.current.pitch };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add('is-panning');
  };
  const handlePointerMove = event => {
    const drag = dragRef.current;
    if (!drag) return;
    viewRef.current.yaw = clamp(drag.yaw - (event.clientX - drag.x) * .0035, -.8, .8);
    viewRef.current.pitch = clamp(drag.pitch - (event.clientY - drag.y) * .003, -.48, .48);
    redrawRef.current?.();
  };
  const handlePointerUp = event => {
    dragRef.current = null;
    event.currentTarget.classList.remove('is-panning');
  };
  const handleWheel = event => {
    event.preventDefault();
    viewRef.current.zoom = clamp(viewRef.current.zoom * Math.exp(-event.deltaY * .001), .65, 2.8);
    redrawRef.current?.();
  };
  const resetView = () => {
    viewRef.current = { yaw: 0, pitch: 0, zoom: 1 };
    redrawRef.current?.();
  };

  return <section className="cinema-pov-card cinema-pov-transition" aria-label="Three-dimensional seat view">
    <div className="cinema-pov-head">
      <div><div className="eyebrow">THEATRE VIEW</div><h2>Seat {selectedLabel}</h2><p>{selectedCount > 1 ? `${selectedCount} seats selected · previewing ${selectedLabel}` : 'Your view from this seat'}</p></div>
      <div className="pov-head-actions"><span className="pov-screen-size">SCREEN SIZE · {screenSizeFt ? `${Number(screenSizeFt).toFixed(0)} ft` : '—'}</span><button type="button" className="btn secondary small" onClick={resetView}>Reset view</button></div>
    </div>
    <div className="cinema-pov-frame"><canvas ref={canvasRef} role="img" aria-label={`${selectedLabel} perspective toward the cinema screen. Drag to look around and scroll to zoom.`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel} />
      <div className="pov-overlay-top"><span className="pov-chip">{movieTitle || 'Now showing'}</span></div>
      <div className="pov-overlay-bottom"><span>{selectedLabel} · Row {cameraSeat?.row_label || '—'}</span><span>DRAG TO PAN · SCROLL TO ZOOM</span></div>
    </div>
  </section>;
}

export default CinemaPOV;
