import type { Tile } from './tiles'
import {
  isFlush,
  isSevenPairs,
  isAllTriplets,
  isJiangDui,
  isGoldenHook,
  isWinningHand,
} from './hand'

export interface FanResult {
  fans: FanType[]
  totalFan: number
  capped: boolean // 是否封顶
}

export interface FanType {
  name: string
  value: number
}

const MAX_FAN = 4

/**
 * Calculate fan for a winning hand in Sichuan Mahjong.
 * Rules:
 * - 自摸: +1 番
 * - 清一色: +2 番
 * - 对对胡/碰碰胡 (all triplets): +1 番
 * - 七对: +2 番
 * - 将对 (all triplets, pair is 2/5/8): +3 番
 * - 金钩钓 (all triplets + single wait): +3 番
 * - 四番封顶
 * - 断幺九不算番
 */
export function calculateFan(
  tiles: Tile[],
  isSelfDrawn: boolean,
): FanResult {
  if (!isWinningHand(tiles)) {
    return { fans: [], totalFan: 0, capped: false }
  }

  const fans: FanType[] = []

  if (isSelfDrawn) {
    fans.push({ name: '自摸', value: 1 })
  }

  if (isFlush(tiles)) {
    fans.push({ name: '清一色', value: 2 })
  }

  if (isSevenPairs(tiles)) {
    fans.push({ name: '七对', value: 2 })
  } else if (isJiangDui(tiles)) {
    fans.push({ name: '将对', value: 3 })
  } else if (isGoldenHook(tiles)) {
    fans.push({ name: '金钩钓', value: 3 })
  } else if (isAllTriplets(tiles)) {
    fans.push({ name: '对对胡', value: 1 })
  }

  let totalFan = fans.reduce((sum, f) => sum + f.value, 0)
  const capped = totalFan > MAX_FAN
  if (capped) {
    totalFan = MAX_FAN
  }

  // Base: if no fans at all but hand wins, it's 平胡
  if (fans.length === 0 || (fans.length === 1 && fans[0].name === '自摸')) {
    // Still valid, base winning
  }

  return { fans, totalFan, capped }
}

export function fanDescription(result: FanResult): string {
  if (result.fans.length === 0) {
    return '平胡'
  }
  const parts = result.fans.map((f) => `${f.name}(${f.value}番)`)
  let desc = parts.join(' + ')
  if (result.capped) {
    desc += ' → 封顶4番'
  }
  return desc
}
