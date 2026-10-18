import type { LexicalKind } from './types'

const split = (value: string): string[] => value.split(/\s+/).filter(Boolean)

const previous = new Set(split('的 地 得 了 着 著 过 過 吗 嗎 呢 吧 啊 呀 哦 嘛 啦 呗 唄 罢 罷'))
const next = new Set(split('把 被 在 从 從 向 对 對 于 於 与 與 和 跟 为 為 以 及 而 且 但 若 因 因为 因為 所以'))
const jaPrevious = new Set(split('は が を に へ で と も の や ね よ か ぞ さ な から まで より だけ ほど など って です ます でした ました だ た て ば'))
const jaNext = new Set<string>()
const englishNext = new Set(split('a an the of to in on at for from with by and or but as if than that this these those into onto upon through over under about because while'))
const negation = new Set(split('不 没 沒 无 無 别 別 未 非 莫 勿 没有 沒有 不是 不再 不曾 不必 不用 不要 不能 不会 不會 不肯 不愿 不願 不敢 无法 無法 从未 從未 从不 從不 ない なく ぬ ず ません いいえ いや no not never neither nor'))

export interface LexicalInfo {
  kind: LexicalKind
  attachment: 'none' | 'previous' | 'next'
}

const kinds: Record<string, LexicalKind> = {
  月亮: 'noun', 晚上: 'noun', 失眠: 'verb', 海: 'noun', 远方: 'noun', 潮声: 'noun', 信: 'noun', 船: 'noun',
  风: 'noun', 站台: 'noun', 盐: 'noun', 人: 'noun', 灯: 'noun', 名字: 'noun', 潮汐: 'noun', 秘密: 'noun',
  星星: 'noun', 归期: 'noun', 窗前: 'noun', 思念: 'noun', 回声: 'noun', 天: 'noun', 自己: 'pronoun',
  路: 'noun', 潮水: 'noun', 沙滩: 'noun', 指纹: 'noun', 话: 'noun', 清晨: 'noun', 整片海: 'noun',
  '的晚上': 'noun', '把远方': 'noun', '说得很轻': 'verb', '沿着潮声': 'verb', 走回去: 'verb', '把没寄出的': 'verb',
  折成船: 'verb', 吹来: 'verb', 带着: 'verb', '那年夏天的盐': 'noun', '在人群里': 'noun', 回头: 'verb',
  '像一盏': 'other', '迟到的灯': 'noun', '把名字': 'noun', 写给: 'verb', '让它': 'function', '替我': 'function',
  保管: 'verb', '如果': 'function', 也有: 'other', '请替我': 'function', 落在: 'verb', '你窗前': 'noun',
  会有: 'other', '就让': 'function', 回答: 'verb', 天快: 'other', 亮了: 'verb', 终于: 'adverb',
  听见: 'verb', 那些: 'pronoun', '绕远的路': 'noun', 都: 'adverb', 通向: 'verb', 你: 'pronoun',
  '退去以后': 'verb', 留下: 'verb', '光的': 'noun', '把最后一句话': 'noun', 交给: 'verb', '清晨的': 'noun',
  我: 'pronoun', 也: 'adverb', 很: 'adverb', 太: 'adverb', 最: 'adverb',
  会: 'other', 有: 'verb', 是: 'other', 在: 'function', 和: 'function', 与: 'function', 让: 'function',
  '♪': 'symbol',
}

const coreKinds = new Set<LexicalKind>(['noun', 'verb', 'adjective', 'negation', 'other', 'adverb', 'pronoun'])

export function classifyWord(text: string): LexicalInfo {
  const trimmed = text.trim()
  if (!trimmed) return { kind: 'whitespace', attachment: 'none' }
  if (/^[♪♩♫♬]+$/u.test(trimmed)) return { kind: 'symbol', attachment: 'none' }
  if (/^[，。！？、；：,.!?;:'"“”‘’（）()[\]{}\-—…]+$/u.test(trimmed)) return { kind: 'punctuation', attachment: 'none' }
  if (negation.has(trimmed)) return { kind: 'negation', attachment: 'previous' }
  if (previous.has(trimmed) || jaPrevious.has(trimmed)) return { kind: 'function', attachment: 'previous' }
  if (next.has(trimmed) || jaNext.has(trimmed) || englishNext.has(trimmed)) return { kind: 'function', attachment: 'next' }
  const known = kinds[trimmed]
  if (known) return { kind: known, attachment: 'none' }
  if (trimmed.endsWith('的') || trimmed.endsWith('地') || trimmed.endsWith('得')) return { kind: 'other', attachment: 'none' }
  return { kind: 'other', attachment: 'none' }
}

export function priorityOf(kind: LexicalKind): number {
  switch (kind) {
    case 'noun':
    case 'verb':
    case 'adjective':
    case 'negation':
      return 3
    case 'other':
      return 2
    case 'adverb':
    case 'pronoun':
      return 1
    default:
      return 0
  }
}

export function isContent(kind: LexicalKind): boolean {
  return coreKinds.has(kind) && kind !== 'function'
}
