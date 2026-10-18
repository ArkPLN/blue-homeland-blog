import { identity, multiply, nodeMatrix } from './math'
import type { Mat2D } from './math'
import type { BlendMode, SolidPrimitive, TextStyle } from './gl/types'
import type { Renderer } from './gl/renderer'

export interface SceneDrawContext {
  renderer: Renderer
  time: number
}

export class Node {
  x = 0
  y = 0
  pivotX = 0
  pivotY = 0
  scaleX = 1
  scaleY = 1
  rotation = 0
  alpha = 1
  visible = true
  readonly children: Node[] = []
  onUpdate: ((time: number, delta: number) => void) | null = null

  add<T extends Node>(...nodes: T[]): this {
    this.children.push(...nodes)
    return this
  }

  remove(node: Node): void {
    const index = this.children.indexOf(node)
    if (index >= 0) this.children.splice(index, 1)
  }

  update(time: number, delta: number): void {
    this.onUpdate?.(time, delta)
    for (const child of this.children) child.update(time, delta)
  }

  draw(ctx: SceneDrawContext, parentMatrix: Mat2D = identity, parentAlpha = 1): void {
    if (!this.visible) return
    const worldAlpha = parentAlpha * this.alpha
    if (worldAlpha <= 0.001) return
    const local = nodeMatrix(
      { x: this.x, y: this.y },
      { x: this.pivotX, y: this.pivotY },
      { x: this.scaleX, y: this.scaleY },
      this.rotation,
    )
    const world = multiply(parentMatrix, local)
    this.drawSelf(ctx, world, worldAlpha)
    for (const child of this.children) child.draw(ctx, world, worldAlpha)
  }

  protected drawSelf(_ctx: SceneDrawContext, _world: Mat2D, _alpha: number): void {}
}

export class Container extends Node {
  constructor() {
    super()
  }
}

export class SolidItem extends Node {
  primitives: SolidPrimitive[] = []
  blend: BlendMode = 'alpha'

  protected override drawSelf(ctx: SceneDrawContext, world: Mat2D, alpha: number): void {
    ctx.renderer.drawSolid(this.primitives, world, alpha, this.blend)
  }
}

export class TextItem extends Node {
  style: TextStyle
  blend: BlendMode = 'alpha'
  blur = 0
  anchorX = 0.5
  anchorY = 0.5

  constructor(style: TextStyle) {
    super()
    this.style = style
  }

  protected override drawSelf(ctx: SceneDrawContext, world: Mat2D, alpha: number): void {
    ctx.renderer.drawText(this.style, world, alpha, this.blend, this.blur, this.anchorX, this.anchorY)
  }
}

export class CallbackNode extends Node {
  private readonly callback: (ctx: SceneDrawContext, world: Mat2D, alpha: number) => void

  constructor(callback: (ctx: SceneDrawContext, world: Mat2D, alpha: number) => void) {
    super()
    this.callback = callback
  }

  protected override drawSelf(ctx: SceneDrawContext, world: Mat2D, alpha: number): void {
    this.callback(ctx, world, alpha)
  }
}
