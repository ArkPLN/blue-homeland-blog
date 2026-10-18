import type { Mat2D, Vec2 } from '../math'
import { transformPoint } from '../math'
import type { BlendMode, Color, FrameTuning, SolidPrimitive, TextStyle } from './types'
import { TextTextureCache } from './texture-cache'

const TEXT_VERTEX = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUv;
uniform mat3 uMatrix;
uniform vec2 uSize;
uniform vec2 uOffset;
uniform vec2 uScreen;
out vec2 vUv;
void main() {
  vec3 local = vec3(aPos * uSize + uOffset, 1.0);
  vec3 world = uMatrix * local;
  vUv = aUv;
  gl_Position = vec4(world.x / uScreen.x * 2.0 - 1.0, 1.0 - world.y / uScreen.y * 2.0, 0.0, 1.0);
}`

const TEXT_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform float uAlpha;
uniform float uBlur;
uniform vec2 uSize;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 color;
  if (uBlur > 0.2) {
    vec2 radius = vec2(uBlur / uSize.x, uBlur / uSize.y);
    vec3 rgb = vec3(0.0);
    float alpha = 0.0;
    for (int i = 0; i < 16; i++) {
      float fi = float(i);
      float r = sqrt((fi + 0.5) / 16.0);
      float angle = fi * 2.39996323;
      vec2 offset = vec2(cos(angle), sin(angle)) * r * radius;
      vec4 sampleColor = texture(uTexture, vUv + offset);
      rgb += sampleColor.rgb;
      alpha += sampleColor.a;
    }
    color = vec4(rgb / 16.0, alpha / 16.0);
  } else {
    color = texture(uTexture, vUv);
  }
  float a = color.a * uAlpha;
  outColor = vec4(color.rgb * a, a);
}`

const SOLID_VERTEX = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec4 aColor;
uniform vec2 uScreen;
out vec4 vColor;
void main() {
  vColor = aColor;
  gl_Position = vec4(aPos.x / uScreen.x * 2.0 - 1.0, 1.0 - aPos.y / uScreen.y * 2.0, 0.0, 1.0);
}`

const SOLID_FRAGMENT = `#version 300 es
precision highp float;
in vec4 vColor;
out vec4 outColor;
void main() {
  outColor = vec4(vColor.rgb * vColor.a, vColor.a);
}`

const FULLSCREEN_VERTEX = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const POST_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform int uMode;
uniform float uAmount;
uniform float uDispersion;
uniform float uSeed;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec4 splitColor(vec4 center, vec4 red, vec4 blue, float amount) {
  vec3 core = center.rgb * (0.84 - clamp(amount, 0.0, 1.0) * 0.18);
  return vec4(max(core, vec3(red.r, center.g, blue.b)), max(center.a, max(red.a, blue.a)));
}

float dotScreen(vec2 p, float angle, float value, float cell) {
  float c = cos(angle);
  float s = sin(angle);
  vec2 rotated = mat2(c, -s, s, c) * p;
  float distanceToCenter = length(fract(rotated / cell) - 0.5) * cell;
  float radius = sqrt(clamp(value, 0.0, 1.0)) * cell * 0.62;
  return 1.0 - smoothstep(radius - 1.2, radius + 1.2, distanceToCenter);
}

void main() {
  vec2 uv = vUv;
  vec4 color;
  if (uMode == 6) {
    color = texture(uTexture, uv);
  } else if (uMode == 0) {
    vec2 screenUv = uv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centered = screenUv - 0.5;
    centered.x *= aspect;
    float r2 = dot(centered, centered);
    float curvature = uAmount * 0.32;
    vec2 lens = centered * (1.0 - curvature * r2 + curvature * 0.16 * r2 * r2);
    lens.x /= aspect;
    vec2 lensUv = lens + 0.5;
    float radius = sqrt(r2);
    vec2 direction = centered / max(radius, 1e-5);
    vec2 offset = direction * uDispersion * 0.012 * smoothstep(0.12, 0.9, radius);
    offset.x /= aspect;
    vec4 center = texture(uTexture, lensUv);
    vec4 red = texture(uTexture, lensUv + vec2(offset.x, -offset.y));
    vec4 blue = texture(uTexture, lensUv - vec2(offset.x, -offset.y));
    color = splitColor(center, red, blue, uAmount);
  } else if (uMode == 1) {
    color = texture(uTexture, uv);
    vec2 frag = gl_FragCoord.xy;
    frag.y = uResolution.y - frag.y;
    float noise = fract(sin(dot(frag, vec2(12.9898, 78.233))) * 43758.5453);
    color.rgb += (noise - 0.5) * uAmount * color.a;
  } else if (uMode == 2) {
    color = texture(uTexture, uv);
    color.rgb = (color.rgb - 0.5 * color.a) * (1.0 + uAmount) + 0.5 * color.a;
  } else if (uMode == 3) {
    vec2 offset = vec2(0.9063, -0.4226) * uAmount * 3.0 / uResolution;
    vec4 center = texture(uTexture, uv);
    vec4 red = texture(uTexture, uv + offset);
    vec4 blue = texture(uTexture, uv - offset);
    color = splitColor(center, red, blue, uAmount);
  } else if (uMode == 4) {
    vec4 source = texture(uTexture, uv);
    vec3 straight = source.a > 0.0 ? source.rgb / source.a : source.rgb;
    float cell = 5.0;
    vec3 screened = vec3(
      dotScreen(gl_FragCoord.xy, radians(15.0), straight.r, cell),
      dotScreen(gl_FragCoord.xy, radians(75.0), straight.g, cell),
      dotScreen(gl_FragCoord.xy, radians(0.0), straight.b, cell)
    );
    color = vec4(mix(straight, screened, uAmount) * source.a, source.a);
  } else {
    color = texture(uTexture, uv);
    vec2 centered = uv - 0.5;
    centered.x *= uResolution.x / max(uResolution.y, 1.0);
    float amount = clamp(smoothstep(0.52, 1.08, length(centered)) * uAmount * 0.6, 0.0, 1.0);
    color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), amount);
  }
  outColor = clamp(color, 0.0, 1.0);
}`

const BLUR_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTexture;
uniform vec2 uDirection;
uniform float uRadius;
void main() {
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  vec4 result = texture(uTexture, vUv) * weights[0];
  for (int i = 1; i < 5; i++) {
    vec2 offset = uDirection * float(i) * uRadius;
    result += texture(uTexture, vUv + offset) * weights[i];
    result += texture(uTexture, vUv - offset) * weights[i];
  }
  outColor = result;
}`

const COMPOSITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uScene;
uniform sampler2D uBlurred;
uniform float uBlurMix;
uniform float uGlitch;
uniform float uSeed;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vUv;
  float gain = 0.0;
  if (uGlitch > 0.0001) {
    float y = 1.0 - uv.y;
    float coarseBand = floor(y * 26.0);
    float fineBand = floor(y * 110.0);
    float coarseNoise = hash21(vec2(coarseBand, uSeed));
    float fineNoise = hash21(vec2(fineBand + 41.0, uSeed * 1.37));
    float coarseGate = step(0.58, coarseNoise);
    float fineGate = step(0.88, fineNoise);
    uv.x += (hash21(vec2(coarseBand + 17.0, uSeed)) * 2.0 - 1.0) * coarseGate * uGlitch * 0.095;
    uv.x += (hash21(vec2(fineBand + 73.0, uSeed)) * 2.0 - 1.0) * fineGate * uGlitch * 0.035;
    gain = (coarseGate * (coarseNoise - 0.58) + fineGate * 0.12) * uGlitch * 0.42;
  }
  vec4 scene = texture(uScene, uv);
  vec4 blurred = texture(uBlurred, uv);
  vec4 color = mix(scene, blurred, clamp(uBlurMix, 0.0, 1.0));
  color.rgb *= 1.0 + gain;
  color.rgb = min(color.rgb, vec3(color.a));
  outColor = clamp(color, 0.0, 1.0);
}`

interface RenderTarget {
  fbo: WebGLFramebuffer
  texture: WebGLTexture
  width: number
  height: number
}

export interface RenderStatistics {
  drawCalls: number
  triangles: number
  frames: number
  cpuMs: number
}

export class Renderer {
  readonly gl: WebGL2RenderingContext
  readonly textures: TextTextureCache
  private readonly canvas: HTMLCanvasElement
  private readonly textProgram: WebGLProgram
  private readonly solidProgram: WebGLProgram
  private readonly postProgram: WebGLProgram
  private readonly blurProgram: WebGLProgram
  private readonly compositeProgram: WebGLProgram
  private readonly textVao: WebGLVertexArrayObject
  private readonly solidVao: WebGLVertexArrayObject
  private readonly solidBuffer: WebGLBuffer
  private readonly fullscreenVao: WebGLVertexArrayObject
  private readonly blitVao: WebGLVertexArrayObject
  private readonly msaaFbo: WebGLFramebuffer
  private readonly msaaColor: WebGLRenderbuffer
  private sceneTarget: RenderTarget | null = null
  private postA: RenderTarget | null = null
  private postB: RenderTarget | null = null
  private blurHalf: RenderTarget | null = null
  private blurHalfTemp: RenderTarget | null = null
  private width = 1
  private height = 1
  private dpr = 1
  private samples = 0
  private batchBlend: BlendMode = 'alpha'
  private readonly batch: number[] = []
  private solidData = new Float32Array(0)
  private readonly textScreenLocation: WebGLUniformLocation | null
  private readonly solidScreenLocation: WebGLUniformLocation | null
  stats: RenderStatistics = { drawCalls: 0, triangles: 0, frames: 0, cpuMs: 0 }
  lastError: string | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    })
    if (!gl) throw new Error('当前浏览器不支持 WebGL2')
    this.gl = gl
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    this.textProgram = this.createProgram(TEXT_VERTEX, TEXT_FRAGMENT)
    this.solidProgram = this.createProgram(SOLID_VERTEX, SOLID_FRAGMENT)
    this.postProgram = this.createProgram(FULLSCREEN_VERTEX, POST_FRAGMENT)
    this.blurProgram = this.createProgram(FULLSCREEN_VERTEX, BLUR_FRAGMENT)
    this.compositeProgram = this.createProgram(FULLSCREEN_VERTEX, COMPOSITE_FRAGMENT)
    this.textScreenLocation = gl.getUniformLocation(this.textProgram, 'uScreen')
    this.solidScreenLocation = gl.getUniformLocation(this.solidProgram, 'uScreen')

    this.textVao = this.createTextQuad()
    this.solidVao = gl.createVertexArray()!
    this.solidBuffer = gl.createBuffer()!
    gl.bindVertexArray(this.solidVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.solidBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8)
    this.fullscreenVao = this.createFullscreenQuad()
    this.blitVao = gl.createVertexArray()!
    gl.bindVertexArray(null)

    this.msaaFbo = gl.createFramebuffer()!
    this.msaaColor = gl.createRenderbuffer()!
    this.textures = new TextTextureCache(gl)
    gl.clearColor(0, 0, 0, 0)
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    const width = Math.max(1, Math.round(cssWidth))
    const height = Math.max(1, Math.round(cssHeight))
    const nextDpr = Math.min(2, Math.max(1, dpr))
    if (this.sceneTarget && width === this.width && height === this.height && Math.abs(nextDpr - this.dpr) < 0.001) return
    this.width = width
    this.height = height
    this.dpr = nextDpr
    const pixelWidth = Math.max(1, Math.round(width * this.dpr))
    const pixelHeight = Math.max(1, Math.round(height * this.dpr))
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth
      this.canvas.height = pixelHeight
    }
    this.sceneTarget = this.disposeTarget(this.sceneTarget)
    this.postA = this.disposeTarget(this.postA)
    this.postB = this.disposeTarget(this.postB)
    this.blurHalf = this.disposeTarget(this.blurHalf)
    this.blurHalfTemp = this.disposeTarget(this.blurHalfTemp)
    this.sceneTarget = this.createTarget(pixelWidth, pixelHeight)
    this.postA = this.createTarget(pixelWidth, pixelHeight)
    this.postB = this.createTarget(pixelWidth, pixelHeight)
    this.blurHalf = this.createTarget(Math.max(1, Math.ceil(pixelWidth / 2)), Math.max(1, Math.ceil(pixelHeight / 2)))
    this.blurHalfTemp = this.createTarget(Math.max(1, Math.ceil(pixelWidth / 2)), Math.max(1, Math.ceil(pixelHeight / 2)))

    const gl = this.gl
    const maxSamples = gl.getParameter(gl.MAX_SAMPLES) as number
    this.samples = maxSamples >= 4 ? 4 : maxSamples >= 2 ? 2 : 0
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaColor)
    if (this.samples > 0) {
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.RGBA8, pixelWidth, pixelHeight)
    } else {
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, pixelWidth, pixelHeight)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFbo)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.msaaColor)
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      this.samples = 0
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaColor)
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, pixelWidth, pixelHeight)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
  }

  beginFrame(): void {
    const gl = this.gl
    const started = performance.now()
    this.stats = { drawCalls: 0, triangles: 0, frames: this.stats.frames + 1, cpuMs: started }
    this.batch.length = 0
    this.batchBlend = 'alpha'
    this.textures.beginFrame()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFbo)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.useProgram(this.solidProgram)
    gl.uniform2f(this.solidScreenLocation, this.width, this.height)
    gl.useProgram(this.textProgram)
    gl.uniform2f(this.textScreenLocation, this.width, this.height)
  }

  drawSolid(primitives: SolidPrimitive[], matrix: Mat2D, alpha: number, blend: BlendMode): void {
    if (primitives.length === 0 || alpha <= 0.001) return
    if (blend !== this.batchBlend) this.flushSolid()
    this.batchBlend = blend
    const pushVertex = (point: Vec2, color: Color): void => {
      const transformed = transformPoint(matrix, point)
      this.batch.push(transformed.x, transformed.y, color.r, color.g, color.b, color.a * alpha)
    }
    const pushTriangle = (a: Vec2, b: Vec2, c: Vec2, color: Color): void => {
      pushVertex(a, color)
      pushVertex(b, color)
      pushVertex(c, color)
    }
    const pushQuad = (a: Vec2, b: Vec2, c: Vec2, d: Vec2, color: Color): void => {
      pushTriangle(a, b, c, color)
      pushTriangle(a, c, d, color)
    }
    const stroke = (points: Vec2[], width: number, color: Color, closed = false, dash = 0, gap = 0): void => {
      if (points.length < 2) return
      const segments: Array<[Vec2, Vec2]> = []
      if (dash > 0) {
        for (let index = 0; index < points.length - 1; index++) {
          const from = points[index]
          const to = points[index + 1]
          const dx = to.x - from.x
          const dy = to.y - from.y
          const length = Math.hypot(dx, dy)
          if (length < 0.001) continue
          const ux = dx / length
          const uy = dy / length
          let cursor = 0
          while (cursor < length) {
            const end = Math.min(length, cursor + dash)
            segments.push([
              { x: from.x + ux * cursor, y: from.y + uy * cursor },
              { x: from.x + ux * end, y: from.y + uy * end },
            ])
            cursor += dash + gap
          }
        }
      } else {
        for (let index = 0; index < points.length - 1; index++) segments.push([points[index], points[index + 1]])
        if (closed && points.length > 2) segments.push([points[points.length - 1], points[0]])
      }
      const half = width / 2
      for (const [from, to] of segments) {
        const dx = to.x - from.x
        const dy = to.y - from.y
        const length = Math.hypot(dx, dy)
        if (length < 0.0001) continue
        const nx = (-dy / length) * half
        const ny = (dx / length) * half
        pushQuad(
          { x: from.x + nx, y: from.y + ny },
          { x: to.x + nx, y: to.y + ny },
          { x: to.x - nx, y: to.y - ny },
          { x: from.x - nx, y: from.y - ny },
          color,
        )
      }
    }
    const circle = (primitive: Extract<SolidPrimitive, { kind: 'circle' }>): void => {
      const count = primitive.segments ?? Math.max(20, Math.min(96, Math.round(primitive.radius * 0.9)))
      if (primitive.fill) {
        const center = { x: primitive.cx, y: primitive.cy }
        for (let index = 0; index < count; index++) {
          const a = (index / count) * Math.PI * 2
          const b = ((index + 1) / count) * Math.PI * 2
          pushTriangle(
            center,
            { x: center.x + Math.cos(a) * primitive.radius, y: center.y + Math.sin(a) * primitive.radius },
            { x: center.x + Math.cos(b) * primitive.radius, y: center.y + Math.sin(b) * primitive.radius },
            primitive.color,
          )
        }
      } else {
        const points: Vec2[] = []
        for (let index = 0; index <= count; index++) {
          const angle = (index / count) * Math.PI * 2
          points.push({ x: primitive.cx + Math.cos(angle) * primitive.radius, y: primitive.cy + Math.sin(angle) * primitive.radius })
        }
        stroke(points, primitive.width ?? 1, primitive.color)
      }
    }
    for (const primitive of primitives) {
      if (primitive.kind === 'stroke') stroke(primitive.points, primitive.width, primitive.color, primitive.closed, primitive.dash, primitive.gap)
      else if (primitive.kind === 'poly') {
        if (primitive.points.length < 3) continue
        for (let index = 1; index < primitive.points.length - 1; index++)
          pushTriangle(primitive.points[0], primitive.points[index], primitive.points[index + 1], primitive.color)
      } else circle(primitive)
    }
  }

  drawText(style: TextStyle, matrix: Mat2D, alpha: number, blend: BlendMode, blur = 0, anchorX = 0.5, anchorY = 0.5): void {
    if (alpha <= 0.001) return
    this.flushSolid()
    const gl = this.gl
    const texture = this.textures.get(style)
    gl.useProgram(this.textProgram)
    gl.bindVertexArray(this.textVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture.texture)
    gl.uniform1i(gl.getUniformLocation(this.textProgram, 'uTexture'), 0)
    gl.uniformMatrix3fv(gl.getUniformLocation(this.textProgram, 'uMatrix'), false, [
      matrix[0], matrix[1], 0,
      matrix[2], matrix[3], 0,
      matrix[4], matrix[5], 1,
    ])
    gl.uniform2f(gl.getUniformLocation(this.textProgram, 'uSize'), texture.width, texture.height)
    gl.uniform2f(gl.getUniformLocation(this.textProgram, 'uOffset'), (0.5 - anchorX) * texture.width, (0.5 - anchorY) * texture.height)
    gl.uniform1f(gl.getUniformLocation(this.textProgram, 'uAlpha'), alpha)
    gl.uniform1f(gl.getUniformLocation(this.textProgram, 'uBlur'), blur)
    this.applyBlend(blend)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    this.stats.drawCalls++
  }

  endFrame(tuning: FrameTuning, blurAmount: number, glitchAmount: number, glitchSeed: number, creditsBlur = 0): void {
    const gl = this.gl
    this.flushSolid()
    if (!this.sceneTarget) return
    if (this.samples > 0) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFbo)
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.sceneTarget.fbo)
      gl.blitFramebuffer(0, 0, this.canvas.width, this.canvas.height, 0, 0, this.sceneTarget.width, this.sceneTarget.height, gl.COLOR_BUFFER_BIT, gl.NEAREST)
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null)
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
    } else {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFbo)
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.sceneTarget.fbo)
      gl.blitFramebuffer(0, 0, this.canvas.width, this.canvas.height, 0, 0, this.sceneTarget.width, this.sceneTarget.height, gl.COLOR_BUFFER_BIT, gl.NEAREST)
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null)
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
    }

    gl.disable(gl.BLEND)
    let source = this.sceneTarget
    if (tuning.postProcess) {
      source = this.applyPostPass(tuning, source)
    }
    const blur = Math.max(blurAmount, creditsBlur)
    if (blur > 0.004) source = this.applyBlur(source, blur)
    this.composite(source, blur > 0.004 ? this.blurHalf! : source, blur > 0.004, glitchAmount, glitchSeed)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.stats.cpuMs = performance.now() - this.stats.cpuMs
  }

  private applyPostPass(tuning: FrameTuning, source: RenderTarget): RenderTarget {
    const passes: Array<{ mode: number; amount: number; dispersion?: number }> = []
    if (tuning.lensDistortion > 0 || tuning.lensDispersion > 0)
      passes.push({ mode: 0, amount: tuning.lensDistortion, dispersion: tuning.lensDispersion })
    if (tuning.grain > 0) passes.push({ mode: 1, amount: tuning.grain })
    if (tuning.contrast > 0) passes.push({ mode: 2, amount: tuning.contrast })
    if (tuning.rgbSplit > 0) passes.push({ mode: 3, amount: tuning.rgbSplit })
    if (tuning.halftone > 0) passes.push({ mode: 4, amount: tuning.halftone })
    if (tuning.vignette > 0) passes.push({ mode: 5, amount: tuning.vignette })
    let current = source
    for (const pass of passes) {
      const target = current === this.postA ? this.postB! : this.postA!
      this.runPostPass(current, target, pass.mode, pass.amount, pass.dispersion ?? 0)
      current = target
    }
    return current
  }

  private runPostPass(source: RenderTarget, target: RenderTarget, mode: number, amount: number, dispersion: number): void {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
    gl.viewport(0, 0, target.width, target.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.postProgram)
    gl.bindVertexArray(this.fullscreenVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, source.texture)
    gl.uniform1i(gl.getUniformLocation(this.postProgram, 'uTexture'), 0)
    gl.uniform2f(gl.getUniformLocation(this.postProgram, 'uResolution'), target.width, target.height)
    gl.uniform1i(gl.getUniformLocation(this.postProgram, 'uMode'), mode)
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'uAmount'), amount)
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'uDispersion'), dispersion)
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'uSeed'), 0.37)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    this.stats.drawCalls++
  }

  private applyBlur(source: RenderTarget, amount: number): RenderTarget {
    const gl = this.gl
    const half = this.blurHalf!
    const temp = this.blurHalfTemp!
    // downsample
    gl.bindFramebuffer(gl.FRAMEBUFFER, half.fbo)
    gl.viewport(0, 0, half.width, half.height)
    gl.useProgram(this.postProgram)
    gl.bindVertexArray(this.fullscreenVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, source.texture)
    gl.uniform1i(gl.getUniformLocation(this.postProgram, 'uTexture'), 0)
    gl.uniform2f(gl.getUniformLocation(this.postProgram, 'uResolution'), half.width, half.height)
    gl.uniform1i(gl.getUniformLocation(this.postProgram, 'uMode'), 6)
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'uAmount'), 0)
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'uDispersion'), 0)
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'uSeed'), 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    const radius = 1.0 + amount * 4.0
    this.runBlur(half, temp, 'h', radius)
    this.runBlur(temp, half, 'v', radius)
    return half
  }

  private runBlur(source: RenderTarget, target: RenderTarget, direction: 'h' | 'v', radius: number): void {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
    gl.viewport(0, 0, target.width, target.height)
    gl.useProgram(this.blurProgram)
    gl.bindVertexArray(this.fullscreenVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, source.texture)
    gl.uniform1i(gl.getUniformLocation(this.blurProgram, 'uTexture'), 0)
    gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'uDirection'), direction === 'h' ? 1 / target.width : 0, direction === 'v' ? 1 / target.height : 0)
    gl.uniform1f(gl.getUniformLocation(this.blurProgram, 'uRadius'), radius)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    this.stats.drawCalls++
  }

  private composite(source: RenderTarget, blurred: RenderTarget, hasBlur: boolean, glitch: number, seed: number): void {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.compositeProgram)
    gl.bindVertexArray(this.fullscreenVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, source.texture)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, blurred.texture)
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'uScene'), 0)
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'uBlurred'), 1)
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'uBlurMix'), hasBlur ? 1 : 0)
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'uGlitch'), glitch)
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'uSeed'), seed)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    this.stats.drawCalls++
    gl.activeTexture(gl.TEXTURE0)
  }

  private flushSolid(): void {
    if (this.batch.length === 0) return
    const gl = this.gl
    gl.useProgram(this.solidProgram)
    gl.bindVertexArray(this.solidVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.solidBuffer)
    if (this.solidData.length < this.batch.length) this.solidData = new Float32Array(this.batch.length * 2)
    this.solidData.set(this.batch)
    gl.bufferData(gl.ARRAY_BUFFER, this.solidData.subarray(0, this.batch.length), gl.DYNAMIC_DRAW)
    this.applyBlend(this.batchBlend)
    gl.drawArrays(gl.TRIANGLES, 0, this.batch.length / 6)
    this.stats.drawCalls++
    this.stats.triangles += this.batch.length / 18
    this.batch.length = 0
  }

  private applyBlend(blend: BlendMode): void {
    const gl = this.gl
    if (blend === 'screen') {
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    } else {
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    }
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl
    const vertex = this.compileShader(gl.VERTEX_SHADER, vertexSource)
    const fragment = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource)
    const program = gl.createProgram()!
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Shader link failed: ${gl.getProgramInfoLog(program) ?? ''}`)
    }
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    return program
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(`Shader compile failed: ${log ?? ''}`)
    }
    return shader
  }

  private createTarget(width: number, height: number): RenderTarget {
    const gl = this.gl
    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { fbo, texture, width, height }
  }

  private disposeTarget(target: RenderTarget | null): RenderTarget | null {
    if (!target) return null
    this.gl.deleteFramebuffer(target.fbo)
    this.gl.deleteTexture(target.texture)
    return null
  }

  private createTextQuad(): WebGLVertexArrayObject {
    const gl = this.gl
    const vao = gl.createVertexArray()!
    const buffer = gl.createBuffer()!
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    const vertices = new Float32Array([
      -0.5, -0.5, 0, 0,
      0.5, -0.5, 1, 0,
      -0.5, 0.5, 0, 1,
      -0.5, 0.5, 0, 1,
      0.5, -0.5, 1, 0,
      0.5, 0.5, 1, 1,
    ])
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)
    gl.bindVertexArray(null)
    return vao
  }

  private createFullscreenQuad(): WebGLVertexArrayObject {
    const gl = this.gl
    const vao = gl.createVertexArray()!
    const buffer = gl.createBuffer()!
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0)
    gl.bindVertexArray(null)
    return vao
  }

  dispose(): void {
    this.textures.dispose()
    this.sceneTarget = this.disposeTarget(this.sceneTarget)
    this.postA = this.disposeTarget(this.postA)
    this.postB = this.disposeTarget(this.postB)
    this.blurHalf = this.disposeTarget(this.blurHalf)
    this.blurHalfTemp = this.disposeTarget(this.blurHalfTemp)
  }
}
