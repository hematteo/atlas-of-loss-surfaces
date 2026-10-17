/* Hidden Layers — small WebGL2 toolkit. Exposes window.GL. */
(function () {
  'use strict';
  class GLError extends Error { constructor(msg, detail) { super(msg); this.detail = detail; } }
  const GL = { GLError };

  GL.context = function (canvas, attrs, required, optional) {
    const gl = canvas.getContext('webgl2', Object.assign({
      alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: 'high-performance',
    }, attrs || {}));
    if (!gl) throw new GLError('This piece needs WebGL2, which this browser or device does not provide.',
      'Try a recent Chrome, Edge, Firefox or Safari (15+) with hardware acceleration enabled.');
    gl.ext = {};
    for (const n of required || []) {
      const e = gl.getExtension(n);
      if (!e) throw new GLError(`This piece needs the WebGL extension ${n}, which this GPU does not expose.`);
      gl.ext[n] = e;
    }
    for (const n of optional || []) gl.ext[n] = gl.getExtension(n);
    gl.emptyVAO = gl.createVertexArray();
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (window.Frame) Frame.fail('The GPU context was lost.', 'Reload the page to restart the piece.');
    });
    return gl;
  };

  // Fullscreen triangle; vUv in [0,1] over the viewport. Draw with GL.fullscreen(gl).
  GL.FULLSCREEN_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  function compile(gl, type, src, label) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s) || '(no log)';
      const lines = src.split('\n');
      const annotated = log.replace(/ERROR: \d+:(\d+):([^\n]*)/g, (m, ln, rest) =>
        `line ${ln}:${rest}\n    > ${(lines[ln - 1] || '').trim()}`);
      throw new GLError(`${label}: ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader failed to compile`, annotated);
    }
    return s;
  }

  const SAMPLER_TARGET = {};
  GL.program = function (gl, vs, fs, label, opts) {
    label = label || 'program';
    if (!SAMPLER_TARGET[gl.SAMPLER_2D]) {
      for (const t of ['SAMPLER_2D', 'INT_SAMPLER_2D', 'UNSIGNED_INT_SAMPLER_2D', 'SAMPLER_2D_SHADOW']) SAMPLER_TARGET[gl[t]] = gl.TEXTURE_2D;
      for (const t of ['SAMPLER_3D', 'INT_SAMPLER_3D', 'UNSIGNED_INT_SAMPLER_3D']) SAMPLER_TARGET[gl[t]] = gl.TEXTURE_3D;
      for (const t of ['SAMPLER_CUBE', 'INT_SAMPLER_CUBE', 'UNSIGNED_INT_SAMPLER_CUBE']) SAMPLER_TARGET[gl[t]] = gl.TEXTURE_CUBE_MAP;
      for (const t of ['SAMPLER_2D_ARRAY', 'INT_SAMPLER_2D_ARRAY', 'UNSIGNED_INT_SAMPLER_2D_ARRAY']) SAMPLER_TARGET[gl[t]] = gl.TEXTURE_2D_ARRAY;
    }
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, label));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, label));
    if (opts && opts.transformFeedback) gl.transformFeedbackVaryings(p, opts.transformFeedback, opts.tfMode != null ? opts.tfMode : gl.SEPARATE_ATTRIBS);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new GLError(`${label}: program failed to link`, gl.getProgramInfoLog(p));
    const uniforms = {};
    let unit = 0;
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      if (info.name.startsWith('gl_')) continue;
      const name = info.name.replace(/\[0\]$/, '');
      const sampler = SAMPLER_TARGET[info.type] !== undefined;
      uniforms[name] = { loc: gl.getUniformLocation(p, info.name), type: info.type, size: info.size, unit: sampler ? unit : -1, target: SAMPLER_TARGET[info.type] };
      if (sampler) unit += info.size;
    }
    const warned = new Set();
    const prog = { gl, program: p, uniforms, label };
    prog.use = () => { gl.useProgram(p); return prog; };
    // Set uniforms by name. Samplers take a WebGLTexture (or {tex}); texture units are assigned automatically.
    prog.set = (vals) => {
      gl.useProgram(p);
      for (const k in vals) {
        const u = uniforms[k];
        if (!u) { if (!warned.has(k)) { warned.add(k); console.warn(`[GL] uniform "${k}" is not active in ${label} (unused or misspelled)`); } continue; }
        setUniform(gl, u, vals[k]);
      }
      return prog;
    };
    return prog;
  };

  function setUniform(gl, u, v) {
    const l = u.loc;
    if (u.unit >= 0) {
      const tex = v && v.tex ? v.tex : v;
      gl.activeTexture(gl.TEXTURE0 + u.unit);
      gl.bindTexture(u.target, tex);
      gl.uniform1i(l, u.unit);
      return;
    }
    const arr = typeof v === 'number' || typeof v === 'boolean' ? null : v;
    switch (u.type) {
      case gl.FLOAT: arr ? gl.uniform1fv(l, arr) : gl.uniform1f(l, v); break;
      case gl.FLOAT_VEC2: gl.uniform2fv(l, arr); break;
      case gl.FLOAT_VEC3: gl.uniform3fv(l, arr); break;
      case gl.FLOAT_VEC4: gl.uniform4fv(l, arr); break;
      case gl.INT: case gl.BOOL: arr ? gl.uniform1iv(l, arr) : gl.uniform1i(l, +v); break;
      case gl.INT_VEC2: case gl.BOOL_VEC2: gl.uniform2iv(l, arr); break;
      case gl.INT_VEC3: case gl.BOOL_VEC3: gl.uniform3iv(l, arr); break;
      case gl.INT_VEC4: case gl.BOOL_VEC4: gl.uniform4iv(l, arr); break;
      case gl.UNSIGNED_INT: arr ? gl.uniform1uiv(l, arr) : gl.uniform1ui(l, v); break;
      case gl.UNSIGNED_INT_VEC2: gl.uniform2uiv(l, arr); break;
      case gl.UNSIGNED_INT_VEC3: gl.uniform3uiv(l, arr); break;
      case gl.UNSIGNED_INT_VEC4: gl.uniform4uiv(l, arr); break;
      case gl.FLOAT_MAT2: gl.uniformMatrix2fv(l, false, arr); break;
      case gl.FLOAT_MAT3: gl.uniformMatrix3fv(l, false, arr); break;
      case gl.FLOAT_MAT4: gl.uniformMatrix4fv(l, false, arr); break;
      default: throw new GLError('Unsupported uniform type 0x' + u.type.toString(16));
    }
  }

  // Texture format presets: GL.texture(gl, w, h, { fmt: 'rgba16f', filter: gl.LINEAR })
  GL.formats = (gl) => ({
    rgba8: [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE],
    rgba16f: [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT],
    rgba32f: [gl.RGBA32F, gl.RGBA, gl.FLOAT],
    rg16f: [gl.RG16F, gl.RG, gl.HALF_FLOAT],
    rg32f: [gl.RG32F, gl.RG, gl.FLOAT],
    r16f: [gl.R16F, gl.RED, gl.HALF_FLOAT],
    r32f: [gl.R32F, gl.RED, gl.FLOAT],
    r8: [gl.R8, gl.RED, gl.UNSIGNED_BYTE],
  });
  GL.texture = function (gl, w, h, o) {
    o = o || {};
    const [internal, format, type] = o.fmt ? GL.formats(gl)[o.fmt] : [o.internal || gl.RGBA8, o.format || gl.RGBA, o.type || gl.UNSIGNED_BYTE];
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, o.data || null);
    const filter = o.filter != null ? o.filter : gl.NEAREST;
    const wrap = o.wrap != null ? o.wrap : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, o.minFilter != null ? o.minFilter : filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    Object.assign(t, { width: w, height: h, internal, format, type });
    return t;
  };
  GL.upload = function (gl, tex, data, x, y, w, h) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x || 0, y || 0, w || tex.width, h || tex.height, tex.format, tex.type, data);
  };

  // Render target: { tex, fbo, width, height, bind(), clear(r,g,b,a), dispose() }
  GL.target = function (gl, w, h, o) {
    const tex = GL.texture(gl, w, h, o);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (st !== gl.FRAMEBUFFER_COMPLETE) throw new GLError('A render target could not be created (format not renderable here).', 'framebuffer status 0x' + st.toString(16) + ' for ' + JSON.stringify(o || {}));
    const t = {
      tex, fbo, width: w, height: h,
      bind() { gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, w, h); return t; },
      clear(r, g, b, a) { t.bind(); gl.clearColor(r || 0, g || 0, b || 0, a || 0); gl.clear(gl.COLOR_BUFFER_BIT); return t; },
      dispose() { gl.deleteFramebuffer(fbo); gl.deleteTexture(tex); },
    };
    return t;
  };
  // Ping-pong pair: read from .read.tex, render into .write, then .swap().
  GL.pingpong = function (gl, w, h, o) {
    const a = GL.target(gl, w, h, o), b = GL.target(gl, w, h, o);
    const pp = {
      read: a, write: b, width: w, height: h,
      swap() { const t = pp.read; pp.read = pp.write; pp.write = t; },
      clear(r, g, b2, al) { a.clear(r, g, b2, al); b.clear(r, g, b2, al); },
      dispose() { a.dispose(); b.dispose(); },
    };
    return pp;
  };
  GL.screen = function (gl) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); };
  GL.fullscreen = function (gl) { gl.bindVertexArray(gl.emptyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  window.GL = GL;
})();
