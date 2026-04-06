import {
  type Tile,
  type Suit,
  tileId,
  countTiles,
} from './tiles'
import { findWaitingTiles } from './waiting'

export interface AIDecision {
  discard: Tile
  reason: string
}

/**
 * AI decides which tile to discard from a 14-tile hand.
 * Strategy: prioritize making the hand tenpai, then maximize waiting tiles.
 */
export function aiChooseDiscard(
  hand: Tile[],
  missingSuit: Suit | null,
): AIDecision {
  // First: discard any remaining tiles of missing suit
  if (missingSuit) {
    const missingSuitTiles = hand.filter((t) => t.suit === missingSuit)
    if (missingSuitTiles.length > 0) {
      return {
        discard: missingSuitTiles[0],
        reason: '清缺门',
      }
    }
  }

  const tc = countTiles(hand)
  const candidates: { tile: Tile; score: number; reason: string }[] = []
  const analyzed = new Set<string>()

  for (const tile of hand) {
    const id = tileId(tile)
    if (analyzed.has(id)) {
      continue
    }
    analyzed.add(id)

    const rem = [...hand]
    const idx = rem.findIndex((t) => tileId(t) === id)
    rem.splice(idx, 1)

    const waiting = findWaitingTiles(rem)
    let score = waiting.length * 100

    // Add score for remaining count of waiting tiles
    for (const wt of waiting) {
      const wid = tileId(wt)
      const inHand = countTiles(rem)[wid] || 0
      score += (4 - inHand)
    }

    // Penalize: don't discard tiles that form groups
    const sameCount = tc[id] || 0
    if (sameCount >= 3) {
      score -= 200 // don't break a triplet
    }

    // Check if tile is isolated (no adjacent tiles)
    const v = tile.value
    const hasPrev = (tc[`${tile.suit}${v - 1}`] || 0) > 0
    const hasNext = (tc[`${tile.suit}${v + 1}`] || 0) > 0
    const hasPrev2 = (tc[`${tile.suit}${v - 2}`] || 0) > 0
    const hasNext2 = (tc[`${tile.suit}${v + 2}`] || 0) > 0

    if (!hasPrev && !hasNext && sameCount === 1) {
      score += 50 // isolated tile, good to discard
    }
    if ((v === 1 || v === 9) && sameCount === 1 && !hasPrev && !hasNext) {
      score += 30 // terminal isolated
    }

    let reason = '效率选择'
    if (waiting.length > 0) {
      reason = `听${waiting.length}面`
    } else if (!hasPrev && !hasNext && !hasPrev2 && !hasNext2 && sameCount === 1) {
      reason = '弃孤张'
    }

    candidates.push({ tile, score, reason })
  }

  // Sort by score descending; highest score = best discard option
  candidates.sort((a, b) => b.score - a.score)

  if (candidates.length > 0) {
    return {
      discard: candidates[0].tile,
      reason: candidates[0].reason,
    }
  }

  // Fallback
  return {
    discard: hand[hand.length - 1],
    reason: '随机',
  }
}

/**
 * AI decides whether to peng (碰).
 */
export function aiShouldPeng(
  hand: Tile[],
  discardedTile: Tile,
  missingSuit: Suit | null,
): boolean {
  if (discardedTile.suit === missingSuit) {
    return false
  }

  const id = tileId(discardedTile)
  const count = countTiles(hand)[id] || 0
  if (count < 2) {
    return false
  }

  // Simple heuristic: peng if it helps (count >= 2 and we're not disrupting)
  return count >= 2
}
