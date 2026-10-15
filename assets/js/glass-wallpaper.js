/*
 * Wallpaper adapter of liquid-glass-web/assets/glass-webgl.js (MIT).
 * Uses the unchanged shared engine's map and channel/refraction math. Changes:
 * cover-aligned two-photo sampling, transparent centres, rim-only drawing,
 * cached textures, bounded map sizes, and explicit resource cleanup. Each
 * visible card renders directly into its own WebGL canvas, with no intermediate
 * WebGL-to-2D bitmap copy during scrolling.
 * Bright rim lighting belongs to the DOM rather than the wallpaper renderer.
 * See UPSTREAM.md and assets/vendor/gentpan-liquidglass.LICENSE.txt.
 */
import { DEFAULTS, renderLensMap } from '../vendor/gentpan-liquidglass.js';

const VERT = `
attribute vec2 aPos;
uniform vec2 uViewport;
varying vec2 vPos;
void main() {
  vPos = aPos;
  vec2 p = aPos / uViewport * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
}`;
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uPhotoA;
uniform sampler2D uPhotoB;
uniform sampler2D uMap;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform vec2 uCanvas;
uniform vec2 uOrigin;
uniform vec2 uOpacity;
uniform vec4 uLens;
uniform vec3 uScale;
uniform vec2 uRim;
varying vec2 vPos;
vec2 cover(vec2 p, vec2 size) {
  float scale = max(uCanvas.x / size.x, uCanvas.y / size.y);
  return clamp((p + (size * scale - uCanvas) * 0.5) / (size * scale), 0.0, 1.0);
}
vec3 source(vec2 p) {
  p += uOrigin;
  vec3 a = texture2D(uPhotoA, cover(p, uSizeA)).rgb;
  vec3 b = texture2D(uPhotoB, cover(p, uSizeB)).rgb;
  vec3 base = vec3(25.0, 44.0, 58.0) / 255.0;
  return mix(mix(base, a, uOpacity.x), b, uOpacity.y);
}
void main() {
  vec4 map = texture2D(uMap, (vPos - uLens.xy) / uLens.zw);
  // Fade along the rounded silhouette, before the strip's inner cut. An opaque
  // photo strip meeting a transparent centre otherwise draws an inset seam.
  vec2 halfSize = uLens.zw * 0.5;
  float radius = min(uRim.x, min(halfSize.x, halfSize.y));
  vec2 q = abs(vPos - uLens.xy - halfSize) - (halfSize - vec2(radius));
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float inset = max(0.0, -dist);
  float alpha = map.a * (1.0 - smoothstep(uRim.y * 0.4, uRim.y, inset));
  if (alpha <= 0.0) discard;
  vec2 bend = map.rg - 0.5019608;
  float r = source(vPos + bend * uScale.r).r;
  float g = source(vPos + bend * uScale.g).g;
  float b = source(vPos + bend * uScale.b).b;
  vec3 color = vec3(r, g, b);
  gl_FragColor = vec4(color * alpha, alpha);
}`;

export function createWallpaperLens(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'default',
  });
  if (!gl || gl.isContextLost()) throw new Error('Wallpaper lens unavailable');
  const program = gl.createProgram();
  for (const [type, code] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      gl.deleteProgram(program);
      throw new Error(error);
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(error);
  }
  gl.useProgram(program);
  const loc = Object.fromEntries([
    'uViewport', 'uCanvas', 'uSizeA', 'uSizeB', 'uPhotoA', 'uPhotoB',
    'uMap', 'uOpacity', 'uLens', 'uScale', 'uOrigin', 'uRim',
  ].map(name => [name, gl.getUniformLocation(program, name)]));
  gl.uniform1i(loc.uPhotoA, 0);
  gl.uniform1i(loc.uPhotoB, 1);
  gl.uniform1i(loc.uMap, 2);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const attribute = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const photos = [{ texture: texture(gl), image: null }, { texture: texture(gl), image: null }];
  const maps = new Map();
  const viewportLimit = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  const sizeLimit = Math.min(8192, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), viewportLimit[0], viewportLimit[1]);
  const textureLimit = Math.min(8192, gl.getParameter(gl.MAX_TEXTURE_SIZE));
  let destroyed = false;

  function quad(x, y, width, height) {
    if (width <= 0 || height <= 0) return;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x, y, x + width, y, x, y + height,
      x, y + height, x + width, y, x + width, y + height,
    ]), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function opticalMap(lens, p) {
    let entry = maps.get(lens.id);
    const key = [p.width, p.height, p.radius, p.bezel, p.specular].join('|');
    if (entry?.key === key) return entry.texture;
    entry ??= { texture: texture(gl) };
    const scale = Math.min(1, Math.sqrt(320000 / (p.width * p.height)),
      textureLimit / p.width, textureLimit / p.height);
    const { canvas: map } = renderLensMap(p, scale);
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map);
    entry.key = key;
    maps.set(lens.id, entry);
    return entry.texture;
  }

  return {
    render(images, lens, opacity, scene) {
      if (destroyed || gl.isContextLost()) throw new Error('Wallpaper lens suspended');
      if (!scene.width || !scene.height) return;
      const { width, height } = lens;
      // Bound each card's direct GPU buffer, including tall article pages.
      // Text never enters these low-resolution decorative rim bitmaps.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5,
        Math.sqrt(2000000 / (width * height)), sizeLimit / width, sizeLimit / height);
      const bw = Math.max(1, Math.floor(width * ratio));
      const bh = Math.max(1, Math.floor(height * ratio));
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      gl.viewport(0, 0, bw, bh);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(loc.uCanvas, scene.width, scene.height);
      for (let i = 0; i < 2; i++) {
        const image = images[i] || images[1 - i];
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, photos[i].texture);
        if (photos[i].image !== image) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          photos[i].image = image;
        }
        gl.uniform2f(i ? loc.uSizeB : loc.uSizeA, image.naturalWidth || image.width, image.naturalHeight || image.height);
      }
      gl.uniform2f(loc.uOpacity, images[0] ? opacity[0] : 0, images[1] ? opacity[1] : 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE2);
      // Cache the shape's map and photo textures; normal scrolling changes
      // only uniforms, and writes straight to the composited card canvas.
      gl.uniform2f(loc.uViewport, lens.width, lens.height);
      gl.uniform2f(loc.uOrigin, lens.x, lens.y);
      const band = lens.compact ? 16 : 24;
      const p = {
        ...DEFAULTS, width: lens.width, height: lens.height, radius: lens.radius,
        bezel: Math.min(1, band / (Math.min(lens.width, lens.height) / 2)),
        curvature: 4, ior: 1.5, specular: 0,
      };
      gl.bindTexture(gl.TEXTURE_2D, opticalMap(lens, p));
      const bend = 2 * (lens.compact ? 18 : 28);
      gl.uniform3f(loc.uScale, bend, bend * 1.05, bend * 1.1);
      gl.uniform4f(loc.uLens, 0, 0, lens.width, lens.height);
      gl.uniform2f(loc.uRim, lens.radius, band);
      // Four non-overlapping strips, rather than filtering/filling the panel.
      // Include the corner radius so rounded corners retain their true mask.
      const edge = Math.min(Math.max(band + 2, lens.radius + 1), lens.width / 2, lens.height / 2);
      quad(0, 0, lens.width, edge);
      quad(0, lens.height - edge, lens.width, edge);
      quad(0, edge, edge, lens.height - 2 * edge);
      quad(lens.width - edge, edge, edge, lens.height - 2 * edge);

      gl.flush();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const photo of photos) gl.deleteTexture(photo.texture);
      for (const entry of maps.values()) gl.deleteTexture(entry.texture);
      maps.clear();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.clear(gl.COLOR_BUFFER_BIT);
      canvas.width = canvas.height = 1;
    },
  };
}

function texture(gl) {
  const value = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, value);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return value;
}
