/** UTF-16 FNV-1a, matching SonnetRandom.Hash. */
export function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** 32-bit unsigned mix, matching SonnetRandom.Mix. */
export function mixSeed(seed: number, salt: number): number {
  return (Math.imul((seed ^ salt) >>> 0, 2654435761) >>> 0)
}

export function hash01(seed: number, index: number, salt = 0x9e3779b9): number {
  const mixed = mixSeed((seed + Math.imul(index + 1, 97)) >>> 0, salt)
  return mixed / 4294967296
}

/** mulberry32 for deterministic layouts that only need a stable stream. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** .NET Framework Random (subtractive generator), used for decoration depth parity. */
export class DotNetRandom {
  private readonly seedArray = new Int32Array(56)
  private inext = 0
  private inextp = 0

  constructor(seed: number) {
    const subtraction = seed === -2147483648 ? 2147483647 : Math.abs(seed)
    let mj = 161803398 - subtraction
    this.seedArray[55] = mj
    let mk = 1
    for (let i = 1; i < 55; i++) {
      const ii = (21 * i) % 55
      this.seedArray[ii] = mk
      mk = mj - mk
      if (mk < 0) mk += 2147483647
      mj = this.seedArray[ii]
    }
    for (let k = 1; k < 5; k++) {
      for (let i = 1; i < 56; i++) {
        this.seedArray[i] -= this.seedArray[1 + ((i + 30) % 55)]
        if (this.seedArray[i] < 0) this.seedArray[i] += 2147483647
      }
    }
    this.inext = 0
    this.inextp = 21
  }

  nextDouble(): number {
    if (++this.inext >= 56) this.inext = 1
    if (++this.inextp >= 56) this.inextp = 1
    let result = this.seedArray[this.inext] - this.seedArray[this.inextp]
    if (result === 2147483647) result -= 1
    if (result < 0) result += 2147483647
    this.seedArray[this.inext] = result
    return result * (1 / 2147483647)
  }
}
