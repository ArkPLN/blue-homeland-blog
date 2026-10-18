import type { Vec2 } from '../../math'
import type { SolidPrimitive } from '../../gl/types'
import type { Theme } from '../types'
import {
  arcPoints,
  circle,
  dashedCircle,
  dashedEllipse,
  diamond,
  ellipsePoints,
  line,
  poly,
  seeded,
  starPoints,
  stroke,
  withOpacity,
} from './draw-helpers'

export interface GeometryContext {
  width: number
  height: number
  seed: number
  theme: Theme
}

const rotate = (points: Vec2[], angle: number): Vec2[] => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return points.map((point) => ({ x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos }))
}

const accent = (ctx: GeometryContext, alpha = 0.55): ReturnType<typeof withOpacity> => withOpacity(ctx.theme.accent, alpha)
const secondary = (ctx: GeometryContext, alpha = 0.4): ReturnType<typeof withOpacity> => withOpacity(ctx.theme.secondary, alpha)
const primary = (ctx: GeometryContext, alpha = 0.7): ReturnType<typeof withOpacity> => withOpacity(ctx.theme.primary, alpha)

function cube(cx: number, cy: number, size: number, color: ReturnType<typeof withOpacity>): SolidPrimitive[] {
  const half = size / 2
  const top = { x: cx, y: cy - half }
  const right = { x: cx + half, y: cy - half * 0.5 }
  const bottom = { x: cx, y: cy }
  const left = { x: cx - half, y: cy - half * 0.5 }
  const lowerBottom = { x: cx, y: cy + half }
  const lowerRight = { x: cx + half, y: cy + half * 0.5 }
  const lowerLeft = { x: cx - half, y: cy + half * 0.5 }
  return [
    poly([top, right, bottom, left], withOpacity(color, color.a * 0.35)),
    stroke([top, right, bottom, left], 1, color, { closed: true }),
    stroke([left, lowerLeft, lowerBottom, lowerRight, right], 1, color),
    line(cx, cy, cx, cy + half, 1, withOpacity(color, color.a * 0.55)),
  ]
}

const mainRecipes: Record<number, { name: string; build: (ctx: GeometryContext) => SolidPrimitive[] }> = {
  0: {
    name: 'SunburstFrame',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = [circle(0, 0, R, accent(ctx, 0.45)), circle(0, 0, R * 0.72, secondary(ctx, 0.3))]
      for (let index = 0; index < 32; index++) {
        const angle = (index / 32) * Math.PI * 2
        const inner = index % 4 === 0 ? R * 0.42 : R * 0.55
        out.push(line(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * R, Math.sin(angle) * R, index % 4 === 0 ? 2 : 1, accent(ctx, index % 4 === 0 ? 0.75 : 0.48)))
      }
      return out
    },
  },
  1: {
    name: 'NestedDiamonds',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.35
      const out: SolidPrimitive[] = []
      for (let index = 0; index < 4; index++) {
        const scale = 1 - index * 0.2
        out.push(stroke(diamond(0, 0, R * scale, R * 0.72 * scale), index === 0 ? 2 : 1, index % 2 === 0 ? accent(ctx, 0.7) : secondary(ctx, 0.5), { closed: true }))
      }
      out.push(line(-R, 0, R, 0, 1, secondary(ctx, 0.22)), line(0, -R * 0.8, 0, R * 0.8, 1, secondary(ctx, 0.22)))
      return out
    },
  },
  2: {
    name: 'HexagonGrid',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.11
      const out: SolidPrimitive[] = []
      const positions: Vec2[] = []
      for (let row = -2; row <= 2; row++) {
        for (let column = -2; column <= 2; column++) {
          const x = column * R * 1.75 + (row % 2) * R * 0.875
          const y = row * R * 1.5
          positions.push({ x, y })
          out.push(stroke(
            Array.from({ length: 6 }, (_, index) => ({ x: x + Math.cos((index / 6) * Math.PI * 2) * R, y: y + Math.sin((index / 6) * Math.PI * 2) * R })),
            1,
            index2(column, row) ? accent(ctx, 0.55) : secondary(ctx, 0.28),
            { closed: true },
          ))
        }
      }
      for (let index = 0; index < positions.length - 1; index += 2)
        out.push(line(positions[index].x, positions[index].y, positions[index + 1].x, positions[index + 1].y, 1, secondary(ctx, 0.2)))
      return out
    },
  },
  3: {
    name: 'Molecules',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.34
      const out: SolidPrimitive[] = []
      const clusters = [
        { x: 0, y: 0, r: R * 0.4 },
        { x: -R * 0.55, y: R * 0.5, r: R * 0.25 },
        { x: R * 0.55, y: -R * 0.42, r: R * 0.22 },
      ]
      for (const cluster of clusters) {
        out.push(circle(cluster.x, cluster.y, cluster.r, accent(ctx, 0.5)))
        for (let index = 0; index < 3; index++) {
          const angle = (index / 3) * Math.PI * 2 + 0.5
          const nx = cluster.x + Math.cos(angle) * cluster.r * 1.6
          const ny = cluster.y + Math.sin(angle) * cluster.r * 1.6
          out.push(line(cluster.x, cluster.y, nx, ny, 1, secondary(ctx, 0.45)), circle(nx, ny, 3.5, primary(ctx, 0.55), { fill: true, segments: 12 }))
        }
      }
      return out
    },
  },
  4: {
    name: 'Orbitals',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = []
      const tilts = [-0.6, 0.2, 0.95]
      for (let index = 0; index < 3; index++)
        out.push(stroke(rotate(ellipsePoints(0, 0, R, R * 0.35, 80), tilts[index]), 1, index === 1 ? accent(ctx, 0.62) : secondary(ctx, 0.4)))
      out.push(circle(0, 0, 7, primary(ctx, 0.9), { fill: true, segments: 18 }))
      return out
    },
  },
  5: {
    name: 'RingedPlanet',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.2
      const out: SolidPrimitive[] = [
        circle(0, 0, R, accent(ctx, 0.45)),
        stroke(rotate(ellipsePoints(0, 0, R * 2.05, R * 0.38, 100), -0.28), 1.5, secondary(ctx, 0.5)),
        stroke(rotate(ellipsePoints(0, 0, R * 2.35, R * 0.5, 100), -0.28), 1, secondary(ctx, 0.24)),
      ]
      for (let index = 0; index < 4; index++) {
        const angle = index * 1.9 + 0.4
        out.push(circle(Math.cos(angle) * R * 2.4, Math.sin(angle) * R * 0.5, 2.5 + index, primary(ctx, 0.6), { fill: true, segments: 10 }))
      }
      return out
    },
  },
  6: {
    name: 'WireframeMountains',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.4
      const out: SolidPrimitive[] = []
      for (let row = 0; row < 4; row++) {
        const points: Vec2[] = []
        for (let column = 0; column <= 24; column++) {
          const x = -R + (column / 24) * R * 2
          const y = R * 0.35 + row * 18 - Math.abs(Math.sin(column * 0.55 + row * 0.8)) * R * (0.5 - row * 0.1)
          points.push({ x, y })
        }
        out.push(stroke(points, 1, row === 2 ? accent(ctx, 0.58) : secondary(ctx, 0.3)))
      }
      for (let column = 0; column <= 12; column++)
        out.push(line(-R + (column / 12) * R * 2, -R * 0.2, -R + (column / 12) * R * 2, R * 0.55, 1, secondary(ctx, 0.16)))
      return out
    },
  },
  7: {
    name: 'Radar',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.34
      const out: SolidPrimitive[] = []
      for (let index = 1; index <= 5; index++) out.push(circle(0, 0, (R * index) / 5, index === 5 ? accent(ctx, 0.45) : secondary(ctx, 0.25)))
      for (let index = 0; index < 72; index++) {
        const angle = (index / 72) * Math.PI * 2
        const inner = index % 6 === 0 ? R * 0.85 : R * 0.92
        out.push(line(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * R, Math.sin(angle) * R, 1, secondary(ctx, 0.32)))
      }
      out.push(stroke(arcPoints(0, 0, R, -1.2, -0.3, 24), 2, accent(ctx, 0.75)))
      out.push(line(-R, -R, R, R, 1, secondary(ctx, 0.16)), line(-R, R, R, -R, 1, secondary(ctx, 0.16)))
      return out
    },
  },
  8: {
    name: 'HudFrame',
    build: (ctx) => {
      const halfW = ctx.width * 0.37
      const halfH = ctx.height * 0.35
      const out: SolidPrimitive[] = [
        line(-halfW, -halfH, -halfW + 44, -halfH, 1, accent(ctx, 0.55)),
        line(-halfW, -halfH, -halfW, -halfH + 44, 1, accent(ctx, 0.55)),
        line(halfW, -halfH, halfW - 44, -halfH, 1, accent(ctx, 0.55)),
        line(halfW, -halfH, halfW, -halfH + 44, 1, accent(ctx, 0.55)),
        line(-halfW, halfH, -halfW + 44, halfH, 1, accent(ctx, 0.4)),
        line(halfW, halfH, halfW - 44, halfH, 1, accent(ctx, 0.4)),
        circle(0, 0, 4, primary(ctx, 0.8), { fill: true, segments: 12 }),
        line(-12, 0, 12, 0, 1, secondary(ctx, 0.5)),
        line(0, -12, 0, 12, 1, secondary(ctx, 0.5)),
      ]
      for (let index = 0; index < 9; index++) {
        const y = -halfH + 16 + index * (ctx.height * 0.08)
        out.push(line(-halfW + 10, y, -halfW + 18, y, 1, secondary(ctx, 0.3)))
        out.push(line(halfW - 18, y, halfW - 10, y, 1, secondary(ctx, 0.3)))
      }
      return out
    },
  },
  9: {
    name: 'IsometricCubes',
    build: (ctx) => {
      const out: SolidPrimitive[] = []
      const size = Math.min(ctx.width, ctx.height) * 0.13
      const positions = [
        [-1.2, -0.8], [0, -1.1], [1.2, -0.8],
        [-0.6, 0.1], [0.6, 0.1],
        [0, 1.0], [1.6, 0.4],
      ]
      positions.forEach(([x, y], index) => {
        out.push(...cube(x * size * 1.5, y * size * 1.5, size, index % 3 === 0 ? accent(ctx, 0.55) : secondary(ctx, 0.35)))
      })
      return out
    },
  },
  10: {
    name: 'Constellation',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.34
      const random = seeded(ctx.seed)
      const points = Array.from({ length: 18 }, () => {
        const angle = random() * Math.PI * 2
        const radius = Math.sqrt(random()) * R
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
      })
      const out: SolidPrimitive[] = []
      points.forEach((point) => out.push(circle(point.x, point.y, 1.8 + random() * 2, primary(ctx, 0.55 + random() * 0.35), { fill: true, segments: 10 })))
      for (let index = 0; index < points.length; index++) {
        for (let other = index + 1; other < points.length; other++) {
          const dx = points[index].x - points[other].x
          const dy = points[index].y - points[other].y
          if (Math.hypot(dx, dy) < R * 0.38) out.push(line(points[index].x, points[index].y, points[other].x, points[other].y, 1, accent(ctx, 0.25)))
        }
      }
      return out
    },
  },
  11: {
    name: 'LunarPhases',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.32
      const out: SolidPrimitive[] = []
      for (let index = 0; index < 7; index++) {
        const x = -R + (index / 6) * R * 2
        out.push(circle(x, 0, R * 0.17, accent(ctx, 0.3)))
        const phase = index / 6
        const offset = R * 0.34 * (phase * 2 - 1)
        out.push(circle(x + offset, 0, R * 0.15, ctx.theme.background, { fill: true, segments: 28 }))
      }
      return out
    },
  },
  12: {
    name: 'Lotus',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.3
      const out: SolidPrimitive[] = []
      for (let layer = 0; layer < 2; layer++) {
        for (let index = 0; index < 7; index++) {
          const angle = (index / 7) * Math.PI * 2 + layer * 0.22
          const petal = rotate(ellipsePoints(R * 0.45, 0, R * 0.23, R * 0.58, 36), angle)
          out.push(stroke(petal, layer === 0 ? 1.5 : 1, layer === 0 ? accent(ctx, 0.5) : secondary(ctx, 0.3), { closed: true }))
        }
      }
      out.push(circle(0, 0, R * 0.12, primary(ctx, 0.5), { fill: true, segments: 18 }))
      return out
    },
  },
  13: {
    name: 'SeedOfLife',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.3
      const out: SolidPrimitive[] = [circle(0, 0, R, accent(ctx, 0.35))]
      for (let index = 0; index < 6; index++) {
        const angle = (index / 6) * Math.PI * 2
        out.push(circle(Math.cos(angle) * R * 0.55, Math.sin(angle) * R * 0.55, R * 0.55, secondary(ctx, 0.34)))
      }
      return out
    },
  },
  14: {
    name: 'ContourAtlas',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = []
      for (let ring = 0; ring < 6; ring++) {
        const points: Vec2[] = []
        const base = R * (0.35 + ring * 0.12)
        for (let index = 0; index <= 90; index++) {
          const angle = (index / 90) * Math.PI * 2
          const wobble = 1 + Math.sin(angle * 5 + ring * 1.4) * 0.075 + Math.cos(angle * 3 - ring) * 0.035
          points.push({ x: Math.cos(angle) * base * wobble, y: Math.sin(angle) * base * 0.72 * wobble })
        }
        out.push(stroke(points, 1, ring % 2 === 0 ? accent(ctx, 0.5) : secondary(ctx, 0.3), { closed: true }))
      }
      return out
    },
  },
  15: {
    name: 'RadialWave',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = []
      for (let index = 0; index < 64; index++) {
        const angle = (index / 64) * Math.PI * 2
        const length = R * (0.72 + Math.sin(index * 0.5 + ctx.seed) * 0.18 + 0.1)
        out.push(line(Math.cos(angle) * R * 0.45, Math.sin(angle) * R * 0.45, Math.cos(angle) * length, Math.sin(angle) * length, index % 4 === 0 ? 2 : 1, index % 2 === 0 ? accent(ctx, 0.5) : secondary(ctx, 0.25)))
      }
      out.push(circle(0, 0, R * 0.42, secondary(ctx, 0.22)))
      return out
    },
  },
  16: {
    name: 'TransitBlueprint',
    build: (ctx) => {
      const halfW = ctx.width * 0.36
      const halfH = ctx.height * 0.34
      const out: SolidPrimitive[] = []
      for (let index = 0; index < 7; index++) {
        out.push(line(-halfW + (index / 6) * halfW * 2, -halfH, -halfW + (index / 6) * halfW * 2, halfH, 1, secondary(ctx, 0.16)))
        out.push(line(-halfW, -halfH + (index / 6) * halfH * 2, halfW, -halfH + (index / 6) * halfH * 2, 1, secondary(ctx, 0.16)))
      }
      const routes = [
        [-0.8, 0.4, -0.3, -0.6, 0.4, -0.2, 0.75, 0.45],
        [-0.6, -0.7, -0.1, 0.2, 0.35, 0.1, 0.8, -0.5],
        [-0.75, 0.05, -0.2, 0.1, 0.25, -0.35, 0.65, 0.2],
      ]
      routes.forEach((route, index) => {
        const points: Vec2[] = []
        for (let step = 0; step < 4; step++) points.push({ x: route[step * 2] * halfW, y: route[step * 2 + 1] * halfH })
        out.push(stroke(points, index === 0 ? 2 : 1.2, index === 0 ? accent(ctx, 0.65) : secondary(ctx, 0.42)))
        points.forEach((point) => out.push(circle(point.x, point.y, 3.2, primary(ctx, 0.55), { fill: true, segments: 10 })))
      })
      return out
    },
  },
  17: {
    name: 'Chronograph',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.32
      const out: SolidPrimitive[] = [circle(0, 0, R, accent(ctx, 0.38)), circle(0, 0, R * 0.86, secondary(ctx, 0.25))]
      for (let index = 0; index < 48; index++) {
        const angle = (index / 48) * Math.PI * 2
        const inner = index % 4 === 0 ? R * 0.78 : R * 0.83
        out.push(line(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * R * 0.88, Math.sin(angle) * R * 0.88, index % 4 === 0 ? 2 : 1, secondary(ctx, 0.4)))
      }
      const hand = (angle: number, length: number) => line(0, 0, Math.cos(angle) * length, Math.sin(angle) * length, 2, primary(ctx, 0.7))
      out.push(hand(-Math.PI / 2 + 1.2, R * 0.55), hand(0.5, R * 0.72))
      out.push(circle(0, 0, 4.5, primary(ctx, 0.9), { fill: true, segments: 14 }))
      return out
    },
  },
  18: {
    name: 'FoldedRibbons',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = []
      for (let ribbon = 0; ribbon < 5; ribbon++) {
        const points: Vec2[] = []
        for (let index = 0; index <= 30; index++) {
          const x = -R + (index / 30) * R * 2
          const y = -R * 0.55 + ribbon * R * 0.25 + Math.sin(index * 0.38 + ribbon * 0.9 + ctx.seed) * R * 0.12
          points.push({ x, y })
        }
        out.push(stroke(points, ribbon === 2 ? 2 : 1, ribbon % 2 === 0 ? accent(ctx, 0.55) : secondary(ctx, 0.34)))
      }
      for (let index = 0; index < 9; index++) {
        const x = -R + (index / 8) * R * 2
        out.push(line(x, -R * 0.58, x, R * 0.58, 1, secondary(ctx, 0.16)))
      }
      return out
    },
  },
  19: {
    name: 'HalftonePoster',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.38
      const out: SolidPrimitive[] = []
      for (let row = 0; row < 12; row++) {
        for (let column = 0; column < 16; column++) {
          const x = -R + (column / 15) * R * 2
          const y = -R * 0.8 + (row / 11) * R * 1.6
          const wave = (Math.sin(column * 0.6 + row * 0.4) + 1) / 2
          out.push(circle(x, y, 1.1 + wave * 3.4, accent(ctx, 0.2 + wave * 0.35), { fill: true, segments: 8 }))
        }
      }
      return out
    },
  },
  20: {
    name: 'OpenArcBrackets',
    build: (ctx) => {
      const halfW = ctx.width * 0.36
      const halfH = ctx.height * 0.34
      const out: SolidPrimitive[] = []
      const corners: Array<[number, number, number]> = [
        [-halfW, -halfH, 0],
        [halfW, -halfH, Math.PI / 2],
        [halfW, halfH, Math.PI],
        [-halfW, halfH, Math.PI * 1.5],
      ]
      corners.forEach(([x, y, angle], index) => {
        out.push(stroke(arcPoints(x, y, 72, angle, angle + Math.PI / 2, 24), index % 2 === 0 ? 2 : 1, accent(ctx, 0.55)))
        out.push(stroke(arcPoints(x, y, 48, angle + 0.15, angle + Math.PI / 2 - 0.15, 20), 1, secondary(ctx, 0.3)))
      })
      return out
    },
  },
  21: {
    name: 'DashedOrbits',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.34
      const out: SolidPrimitive[] = [
        dashedEllipse(0, 0, R, R * 0.42, 1.5, accent(ctx, 0.5), 12, 9),
        dashedEllipse(0, 0, R * 1.3, R * 0.55, 1, secondary(ctx, 0.32), 8, 8),
        dashedEllipse(0, 0, R * 0.74, R * 0.3, 1, secondary(ctx, 0.28), 5, 10),
      ]
      for (let index = 0; index < 5; index++) {
        const angle = index * 1.3 + 0.4
        out.push(circle(Math.cos(angle) * R * 1.3, Math.sin(angle) * R * 0.55, 3 + index * 0.8, primary(ctx, 0.6), { fill: true, segments: 10 }))
      }
      return out
    },
  },
  22: {
    name: 'SpiralGalaxy',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = []
      for (let arm = 0; arm < 2; arm++) {
        const points: Vec2[] = []
        for (let index = 0; index < 70; index++) {
          const angle = index * 0.14 + arm * Math.PI
          const radius = R * (index / 70) * 0.9
          points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.7 })
        }
        out.push(stroke(points, 1.2, arm === 0 ? accent(ctx, 0.4) : secondary(ctx, 0.28)))
      }
      const random = seeded(ctx.seed)
      for (let index = 0; index < 60; index++) {
        const angle = random() * Math.PI * 2
        const radius = Math.sqrt(random()) * R * 0.9
        out.push(circle(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, 0.7 + random() * 1.6, primary(ctx, 0.22 + random() * 0.35), { fill: true, segments: 6 }))
      }
      out.push(circle(0, 0, 4, primary(ctx, 0.8), { fill: true, segments: 16 }))
      return out
    },
  },
  23: {
    name: 'SoundWave',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = []
      for (let wave = 0; wave < 5; wave++) {
        const points: Vec2[] = []
        for (let index = 0; index <= 64; index++) {
          const x = -R + (index / 64) * R * 2
          const envelope = Math.sin((index / 64) * Math.PI)
          const y = -R * 0.4 + wave * 17 + Math.sin(index * 0.34 + wave * 0.9 + ctx.seed) * R * 0.1 * envelope
          points.push({ x, y })
        }
        out.push(stroke(points, wave === 2 ? 2 : 1, wave % 2 === 0 ? accent(ctx, 0.55) : secondary(ctx, 0.32)))
      }
      for (let index = 0; index < 22; index++) {
        const x = -R + (index / 21) * R * 2
        const height = 12 + ((index * 37 + ctx.seed) % 60)
        out.push(line(x, R * 0.62, x, R * 0.62 - height, 2, accent(ctx, 0.25 + (height / 140))))
      }
      return out
    },
  },
  24: {
    name: 'TideGauge',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.33
      const out: SolidPrimitive[] = [circle(0, 0, R, accent(ctx, 0.34)), circle(0, 0, R * 0.7, secondary(ctx, 0.22))]
      for (let index = 0; index < 3; index++) {
        const points: Vec2[] = []
        for (let step = 0; step <= 48; step++) {
          const x = -R + (step / 48) * R * 2
          points.push({ x, y: -R * 0.1 + index * 14 + Math.sin(step * 0.32 + index + ctx.seed) * 9 })
        }
        out.push(stroke(points, index === 1 ? 2 : 1, index === 1 ? accent(ctx, 0.55) : secondary(ctx, 0.28)))
      }
      out.push(line(0, -R, 0, -R * 0.55, 2, primary(ctx, 0.5)))
      return out
    },
  },
  25: {
    name: 'PrismBeam',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.34
      const out: SolidPrimitive[] = [
        stroke([{ x: -R * 0.2, y: -R * 0.8 }, { x: R * 0.65, y: R * 0.5 }, { x: -R * 0.85, y: R * 0.5 }], 2, accent(ctx, 0.55), { closed: true }),
        line(-R, -R * 0.05, -R * 0.15, -R * 0.05, 1, secondary(ctx, 0.4)),
      ]
      for (let index = 0; index < 7; index++) {
        const angle = -0.2 + index * 0.17
        out.push(line(R * 0.2, R * 0.1, Math.cos(angle) * R * 1.15, Math.sin(angle) * R * 1.15, 1, accent(ctx, 0.22 + index * 0.03)))
      }
      return out
    },
  },
  26: {
    name: 'WeaveBand',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.36
      const out: SolidPrimitive[] = []
      for (let band = 0; band < 7; band++) {
        const points: Vec2[] = []
        for (let step = 0; step <= 48; step++) {
          const x = -R + (step / 48) * R * 2
          const y = -R * 0.5 + band * R * 0.16 + Math.sin(step * 0.42 + band * 1.2) * R * 0.12
          points.push({ x, y })
        }
        out.push(stroke(points, band % 2 === 0 ? 2 : 1, band % 2 === 0 ? accent(ctx, 0.48) : secondary(ctx, 0.25)))
      }
      for (let step = 0; step < 12; step++) out.push(line(-R + step * (R / 6), -R * 0.5, -R + step * (R / 6), R * 0.55, 1, secondary(ctx, 0.13)))
      return out
    },
  },
  27: {
    name: 'OrbitSatellites',
    build: (ctx) => {
      const R = Math.min(ctx.width, ctx.height) * 0.34
      const out: SolidPrimitive[] = [circle(0, 0, R * 0.2, accent(ctx, 0.5), { fill: true, segments: 24 })]
      for (let ring = 0; ring < 3; ring++) {
        const radius = R * (0.5 + ring * 0.24)
        out.push(circle(0, 0, radius, ring === 1 ? accent(ctx, 0.38) : secondary(ctx, 0.24)))
        const count = 2 + ring
        for (let index = 0; index < count; index++) {
          const angle = (index / count) * Math.PI * 2 + ring * 0.4
          out.push(circle(Math.cos(angle) * radius, Math.sin(angle) * radius, 3 + ring, primary(ctx, 0.6), { fill: true, segments: 10 }))
        }
      }
      return out
    },
  },
}

const implementedMainIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]

export function resolveMainRecipe(variant: number): number {
  if (implementedMainIds.includes(variant)) return variant
  return implementedMainIds[((variant % implementedMainIds.length) + implementedMainIds.length) % implementedMainIds.length]
}

export function mainGeometryName(id: number): string {
  return mainRecipes[resolveMainRecipe(id)]?.name ?? 'Abstract'
}

export function buildMainGeometry(id: number, ctx: GeometryContext): SolidPrimitive[] {
  return mainRecipes[resolveMainRecipe(id)]?.build(ctx) ?? []
}

export function buildHud(variant: number, ctx: GeometryContext): SolidPrimitive[] {
  const halfW = ctx.width * 0.46
  const halfH = ctx.height * 0.44
  const out: SolidPrimitive[] = []
  if (variant === 0) {
    const cross = (x: number, y: number, size: number, color: ReturnType<typeof withOpacity>) => {
      out.push(line(x - size, y, x + size, y, 1, color), line(x, y - size, x, y + size, 1, color))
    }
    cross(-halfW, -halfH, 4, accent(ctx, 0.5))
    cross(halfW, -halfH, 4, accent(ctx, 0.5))
    cross(-halfW, halfH, 4, accent(ctx, 0.5))
    cross(halfW, halfH, 4, accent(ctx, 0.5))
    for (let index = 0; index < 8; index++) cross(-halfW + 7, -halfH + 30 + index * 20, 3, secondary(ctx, 0.32))
    out.push(line(-halfW + 20, halfH - 10, halfW - 20, halfH - 10, 1, secondary(ctx, 0.32)))
    out.push(circle(0, 0, 2, secondary(ctx, 0.8), { fill: true, segments: 10 }))
  } else if (variant === 1) {
    const arm = Math.min(halfW, halfH) * 0.16
    for (const [x, y, sx, sy] of [[-halfW, -halfH, 1, 1], [halfW, -halfH, -1, 1], [-halfW, halfH, 1, -1], [halfW, halfH, -1, -1]]) {
      out.push(line(x, y, x + arm * sx, y, 2, secondary(ctx, 0.5)), line(x, y, x, y + arm * sy, 2, secondary(ctx, 0.5)))
      out.push(line(x + 6 * sx, y, x + arm * sx, y, 1, accent(ctx, 0.3)), line(x, y + 6 * sy, x, y + arm * sy, 1, accent(ctx, 0.3)))
    }
    for (let index = 0; index < 24; index++) {
      const x = -halfW + (index / 23) * halfW * 2
      out.push(line(x, halfH + 4, x, halfH + (index % 6 === 0 ? 14 : 9), 1, secondary(ctx, 0.4)))
    }
  } else if (variant === 2) {
    for (const y of [-halfH, halfH]) {
      out.push(line(-halfW, y, halfW, y, 2, secondary(ctx, 0.42)), line(-halfW, y + (y < 0 ? 6 : -6), halfW, y + (y < 0 ? 6 : -6), 1, secondary(ctx, 0.2)))
    }
    out.push(line(-halfW, -halfH, -halfW + 14, -halfH + 6, 1, accent(ctx, 0.4)))
    out.push(line(halfW - 14, halfH, halfW, halfH - 6, 1, accent(ctx, 0.4)))
    for (let index = 0; index < 5; index++) {
      const x = -halfW + 20 + index * 18
      out.push(line(x, -halfH - 4, x, -halfH - 10, 1, accent(ctx, 0.4)))
    }
    out.push(circle(0, -halfH, 4, primary(ctx, 0.55)), circle(0, -halfH, 1.5, primary(ctx, 0.9), { fill: true, segments: 8 }))
  } else if (variant === 3) {
    const size = Math.min(halfW, halfH) * 0.2
    for (const [x, y, sx, sy] of [[-halfW, -halfH, 1, 1], [halfW, -halfH, -1, 1], [-halfW, halfH, 1, -1], [halfW, halfH, -1, -1]]) {
      out.push(line(x, y, x + size * sx, y, 1.5, accent(ctx, 0.45)))
      out.push(line(x, y, x + size * 0.7 * sx, y + size * 0.7 * sy, 1, secondary(ctx, 0.32)))
      out.push(line(x, y + 10 * sy, x + size * 0.35 * sx, y + 10 * sy, 1, secondary(ctx, 0.22)))
    }
  } else if (variant === 4) {
    for (let index = 0; index < 14; index++) {
      const y = -halfH + 16 + index * ((halfH * 2 - 32) / 13)
      const strong = index % 4 === 0
      out.push(circle(-halfW + 10, y, strong ? 2.4 : 1.4, strong ? accent(ctx, 0.6) : secondary(ctx, 0.3), { fill: true, segments: 8 }))
      out.push(circle(halfW - 10, y, strong ? 2.4 : 1.4, strong ? accent(ctx, 0.6) : secondary(ctx, 0.3), { fill: true, segments: 8 }))
    }
    out.push(line(-halfW + 10, 0, -halfW + 20, 0, 1, secondary(ctx, 0.4)), line(halfW - 20, 0, halfW - 10, 0, 1, secondary(ctx, 0.4)))
  } else if (variant === 5) {
    const inset = 6
    out.push(line(-halfW + inset, -halfH + inset, halfW - inset, -halfH + inset, 2, secondary(ctx, 0.38)))
    out.push(line(-halfW + inset, halfH - inset, halfW - inset, halfH - inset, 2, secondary(ctx, 0.38)))
    out.push(line(-halfW + inset, -halfH + 18, -halfW + inset, halfH - 18, 2, secondary(ctx, 0.38)))
    out.push(line(halfW - inset, -halfH + 18, halfW - inset, halfH - 18, 2, secondary(ctx, 0.38)))
    out.push(line(-halfW + 13, -halfH + 13, halfW - 13, -halfH + 13, 1, accent(ctx, 0.18)))
    out.push(line(-halfW + 13, halfH - 13, halfW - 13, halfH - 13, 1, accent(ctx, 0.18)))
    for (const [x, y] of [[-halfW + 6, -halfH + 6], [halfW - 6, -halfH + 6], [-halfW + 6, halfH - 6], [halfW - 6, halfH - 6]])
      out.push(circle(x, y, 3, accent(ctx, 0.55), { fill: true, segments: 8 }))
  } else if (variant === 6) {
    for (let index = 0; index < 33; index++) {
      const x = -halfW + (index / 32) * halfW * 2
      const length = index % 8 === 0 ? 12 : index % 4 === 0 ? 7 : 4
      out.push(line(x, -halfH, x, -halfH + length, 1, secondary(ctx, 0.35)))
      out.push(line(x, halfH, x, halfH - length, 1, secondary(ctx, 0.35)))
    }
    for (let index = 0; index < 19; index++) {
      const y = -halfH + (index / 18) * halfH * 2
      const length = index % 6 === 0 ? 12 : index % 3 === 0 ? 7 : 4
      out.push(line(-halfW, y, -halfW + length, y, 1, secondary(ctx, 0.35)))
      out.push(line(halfW, y, halfW - length, y, 1, secondary(ctx, 0.35)))
    }
    out.push(circle(0, 0, 10, accent(ctx, 0.4)), circle(0, 0, 3, primary(ctx, 0.7), { fill: true, segments: 10 }))
  } else {
    const radius = Math.min(halfW, halfH) * 0.24
    const corners = [[-halfW, -halfH, 0], [halfW, -halfH, Math.PI / 2], [halfW, halfH, Math.PI], [-halfW, halfH, Math.PI * 1.5]]
    for (const [x, y, angle] of corners) out.push(stroke(arcPoints(x, y, radius, angle, angle + Math.PI / 2, 18), 2, accent(ctx, 0.42)))
    out.push(stroke(arcPoints(0, halfH - 4, radius, Math.PI, Math.PI * 2, 24, radius * 0.55), 1.5, secondary(ctx, 0.4)))
    out.push(line(0, halfH - 4, Math.cos(Math.PI + 1.2) * (radius - 8), halfH - 4 + Math.sin(Math.PI + 1.2) * (radius - 8), 2, primary(ctx, 0.45)))
  }
  return out
}

export function buildFixedGeometry(variant: number, ctx: GeometryContext): SolidPrimitive[] {
  const R = Math.min(ctx.width, ctx.height) * 0.16
  const main = variant % 2 === 0 ? accent(ctx, 0.36) : primary(ctx, 0.28)
  const fine = secondary(ctx, 0.25)
  const out: SolidPrimitive[] = []
  switch (variant) {
    case 0:
      out.push(poly([{ x: -R, y: -R * 0.22 }, { x: R, y: -R * 0.22 }, { x: R, y: R * 0.22 }, { x: -R, y: R * 0.22 }], withOpacity(main, main.a * 0.4)))
      out.push(stroke([{ x: -R * 0.8, y: -R * 0.55 }, { x: R * 0.8, y: -R * 0.55 }, { x: R * 0.8, y: R * 0.55 }, { x: -R * 0.8, y: R * 0.55 }], 1, main, { closed: true }))
      for (let index = 0; index < 7; index++) out.push(line(-R * 0.6 + index * 20, R * 0.4, -R * 0.6 + index * 20 + 16, -R * 0.4, 1, fine))
      break
    case 1:
      out.push(poly([{ x: -R * 0.7, y: -R }, { x: -R * 0.2, y: -R }, { x: -R * 0.2, y: R }, { x: -R * 0.7, y: R }], withOpacity(main, main.a * 0.35)))
      out.push(poly([{ x: R * 0.25, y: -R }, { x: R * 0.65, y: -R }, { x: R * 0.65, y: R }, { x: R * 0.25, y: R }], withOpacity(main, main.a * 0.35)))
      out.push(stroke([{ x: -R, y: -R * 0.8 }, { x: -R * 0.5, y: -R * 0.8 }, { x: -R * 0.5, y: R * 0.8 }, { x: -R, y: R * 0.8 }], 1, fine, { closed: true }))
      for (let index = 0; index < 5; index++) out.push(line(-R * 0.15 + index * 14, R * 0.7, -R * 0.15 + index * 14 + 18, -R * 0.7, 1, fine))
      break
    case 2:
      out.push(circle(0, 0, R * 0.7, withOpacity(main, main.a * 0.35), { fill: true, segments: 38 }))
      out.push(circle(0, 0, R * 0.48, fine), circle(0, 0, R * 0.9, accent(ctx, 0.3)), circle(0, 0, R, secondary(ctx, 0.18)))
      break
    case 3:
      out.push(stroke(diamond(0, 0, R), 2, main, { closed: true }), stroke(diamond(0, 0, R * 0.55), 1, fine, { closed: true }))
      out.push(poly(diamond(0, 0, R * 0.22), withOpacity(main, main.a * 0.4)))
      for (let index = 0; index < 6; index++) out.push(line(-R + index * 22, R * 0.8, -R + index * 22 + 16, R * 0.5, 1, fine))
      break
    case 4:
      for (let index = 0; index < 3; index++) {
        const y = -R * 0.6 + index * R * 0.55
        out.push(poly([{ x: -R, y }, { x: R, y }, { x: R, y: y + R * 0.32 }, { x: -R, y: y + R * 0.32 }], withOpacity(index === 1 ? main : fine, 0.18)))
      }
      for (let index = 0; index < 8; index++) out.push(line(-R + index * 26, R * 0.8, -R + index * 26 + 20, -R * 0.8, 1, secondary(ctx, 0.16)))
      break
    case 5:
      out.push(poly([{ x: -R, y: -R }, { x: -R * 0.3, y: -R }, { x: -R * 0.3, y: -R * 0.3 }, { x: -R, y: -R * 0.3 }], withOpacity(main, 0.4)))
      out.push(poly([{ x: R * 0.3, y: R * 0.3 }, { x: R, y: R * 0.3 }, { x: R, y: R }, { x: R * 0.3, y: R }], withOpacity(main, 0.4)))
      out.push(stroke([{ x: -R * 0.8, y: R * 0.8 }, { x: R * 0.8, y: R * 0.8 }, { x: R * 0.8, y: R * 0.4 }], 1, fine))
      break
    case 6:
      out.push(poly([{ x: -R * 0.75, y: R * 0.7 }, { x: R * 0.6, y: R * 0.7 }, { x: R * 0.6, y: -R * 0.7 }], withOpacity(main, 0.26)))
      out.push(stroke([{ x: -R * 0.8, y: -R * 0.7 }, { x: R * 0.8, y: -R * 0.7 }, { x: R * 0.8, y: R * 0.7 }], 1.5, main))
      for (let index = 0; index < 5; index++) out.push(line(-R * 0.7 + index * 25, R * 0.5, -R * 0.7 + index * 25 + 18, -R * 0.5, 1, fine))
      break
    default:
      out.push(poly([{ x: -R * 0.35, y: -R }, { x: R * 0.35, y: -R }, { x: R * 0.35, y: R }, { x: -R * 0.35, y: R }], withOpacity(main, 0.3)))
      out.push(poly([{ x: -R, y: -R * 0.3 }, { x: R, y: -R * 0.3 }, { x: R, y: R * 0.3 }, { x: -R, y: R * 0.3 }], withOpacity(main, 0.3)))
      out.push(circle(0, 0, R * 0.75, fine), circle(0, 0, R * 0.5, secondary(ctx, 0.2)))
      break
  }
  return out
}

export function buildTextFixedGeometry(variant: number, width: number, height: number, theme: Theme): SolidPrimitive[] {
  const halfW = width / 2
  const halfH = height / 2
  const color = withOpacity(theme.primary, 0.32)
  const fine = withOpacity(theme.secondary, 0.3)
  const out: SolidPrimitive[] = []
  switch (variant) {
    case 0:
      out.push(stroke([{ x: -halfW, y: -halfH }, { x: halfW, y: -halfH }, { x: halfW, y: halfH }, { x: -halfW, y: halfH }], 1, color, { closed: true }))
      break
    case 1:
      out.push(stroke(diamond(0, 0, halfW * 1.15, halfH * 1.15), 1, color, { closed: true }))
      break
    case 2:
      out.push(circle(0, 0, Math.max(halfW, halfH) * 1.1, color), line(-halfW * 1.3, 0, halfW * 1.3, 0, 1, fine), line(0, -halfH * 1.6, 0, halfH * 1.6, 1, fine))
      break
    case 3:
      out.push(stroke(arcPoints(0, 0, halfW * 1.2, -0.9, 0.2, 24, halfH * 1.3), 1.5, color))
      out.push(stroke(arcPoints(0, 0, halfW * 1.2, 2.2, 3.4, 24, halfH * 1.3), 1.5, withOpacity(theme.secondary, 0.3)))
      break
    case 4:
      out.push(circle(0, 0, Math.max(halfW, halfH) * 1.1, color))
      for (let index = 0; index < 7; index++) out.push(line(-halfW + index * (width / 6), -halfH, -halfW + index * (width / 6), halfH, 1, fine))
      break
    case 5: {
      const heights = [0.24, 0.35, 0.2, 0.82, 0.3, 0.1, 0.23, 0.16]
      heights.forEach((value, index) => out.push(line(-halfW + index * (width / 7), halfH, -halfW + index * (width / 7), halfH - height * value, 2, color)))
      break
    }
    default:
      for (let index = 0; index < 5; index++) {
        const y = -halfH + index * (height / 4)
        out.push(stroke([{ x: -halfW * 1.4, y }, { x: -halfW * 0.5, y }, { x: -halfW * 0.2, y: y - height * 0.2 }, { x: halfW * 1.4, y: y - height * 0.2 }], 1, index % 2 === 0 ? color : fine))
      }
      break
  }
  return out
}

function index2(column: number, row: number): boolean {
  return ((column + row * 3) & 1) === 0
}
