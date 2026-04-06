import {
  type Tile,
  type Suit,
  type TileCounts,
  tileId,
  parseTileId,
  countTiles,
  SUITS,
  VALUES,
  allUniqueTiles,
} from './tiles'
import { canDecomposeMelds } from './hand'

export interface WaitingResult {
  waitingTiles: Tile[]
  totalRemaining: number // based on visible tiles
}

export interface DiscardAnalysis {
  discard: Tile
  waiting: WaitingResult
  efficiency: number // higher is better
}

/**
 * Find all tiles that would complete a 13-tile hand into a winning hand.
 */
export function findWaitingTiles(hand: Tile[]): Tile[] {
  if (hand.length !== 13) {
    return []
  }

  const tc = countTiles(hand)
  const waiting: Tile[] = []
  const unique = allUniqueTiles()

  for (const candidate of unique) {
    const cid = tileId(candidate)
    const currentCount = tc[cid] || 0
    if (currentCount >= 4) {
      continue
    }
    // Temporarily add this tile and check for win
    const testCounts = { ...tc }
    testCounts[cid] = currentCount + 1

    if (isWinningFromCounts(testCounts)) {
      waiting.push(candidate)
    }
  }

  return waiting
}

/**
 * Check win from TileCounts directly (faster than converting to array).
 */
function isWinningFromCounts(tc: TileCounts): boolean {
  const total = Object.values(tc).reduce((a, b) => a + b, 0)
  if (total % 3 !== 2) {
    return false
  }

  // Check seven pairs
  if (total === 14) {
    const vals = Object.values(tc)
    if (vals.length === 7 && vals.every((c) => c === 2)) {
      return true
    }
  }

  // Standard decomposition: pick pair, decompose rest into melds
  for (const suit of SUITS) {
    for (const v of VALUES) {
      const id = `${suit}${v}`
      const count = tc[id] || 0
      if (count < 2) {
        continue
      }

      const remaining = { ...tc }
      remaining[id] -= 2
      if (remaining[id] === 0) {
        delete remaining[id]
      }

      let valid = true
      for (const s of SUITS) {
        const counts = buildSuitCounts(remaining, s)
        if (!canDecomposeMelds(counts)) {
          valid = false
          break
        }
      }
      if (valid) {
        return true
      }
    }
  }

  return false
}

function buildSuitCounts(tc: TileCounts, suit: Suit): number[] {
  const arr = new Array(9).fill(0)
  for (let v = 1; v <= 9; v++) {
    arr[v - 1] = tc[`${suit}${v}`] || 0
  }
  return arr
}

/**
 * For a 14-tile hand, analyze every possible discard and find
 * which discard produces the best waiting.
 */
export function analyzeAllDiscards(
  hand: Tile[],
  visibleCounts?: TileCounts,
): DiscardAnalysis[] {
  if (hand.length !== 14) {
    return []
  }

  const tc = countTiles(hand)
  const analyses: DiscardAnalysis[] = []
  const analyzed = new Set<string>()

  for (const tile of hand) {
    const id = tileId(tile)
    if (analyzed.has(id)) {
      continue
    }
    analyzed.add(id)

    // Remove this tile from hand
    const remaining = { ...tc }
    remaining[id] -= 1
    if (remaining[id] === 0) {
      delete remaining[id]
    }

    const remainingArr = countsToTilesLocal(remaining)
    const waitingTiles = findWaitingTiles(remainingArr)

    let totalRemaining = 0
    if (visibleCounts) {
      for (const wt of waitingTiles) {
        const wid = tileId(wt)
        const seen = visibleCounts[wid] || 0
        totalRemaining += 4 - seen
      }
    } else {
      // Without visible info, estimate max possible
      for (const wt of waitingTiles) {
        const wid = tileId(wt)
        const inHand = remaining[wid] || 0
        totalRemaining += 4 - inHand
      }
    }

    analyses.push({
      discard: tile,
      waiting: {
        waitingTiles,
        totalRemaining,
      },
      efficiency: waitingTiles.length * 100 + totalRemaining,
    })
  }

  return analyses.sort((a, b) => b.efficiency - a.efficiency)
}

function countsToTilesLocal(tc: TileCounts): Tile[] {
  const tiles: Tile[] = []
  for (const [id, count] of Object.entries(tc)) {
    const tile = parseTileId(id)
    for (let i = 0; i < count; i++) {
      tiles.push({ ...tile })
    }
  }
  return tiles
}

/**
 * Calculate 进张 (useful incoming tiles) for a hand.
 * Returns tiles that would improve the hand (create new melds/pairs).
 */
export function findUsefulTiles(hand: Tile[]): Tile[] {
  const tc = countTiles(hand)
  const useful: Tile[] = []

  for (const candidate of allUniqueTiles()) {
    const cid = tileId(candidate)
    if ((tc[cid] || 0) >= 4) {
      continue
    }

    const suit = candidate.suit
    const v = candidate.value

    // Would form a pair
    if ((tc[cid] || 0) >= 1) {
      useful.push(candidate)
      continue
    }

    // Would extend existing tiles into sequences
    const prevId = v > 1 ? `${suit}${v - 1}` : null
    const nextId = v < 9 ? `${suit}${v + 1}` : null
    const prev2Id = v > 2 ? `${suit}${v - 2}` : null

    if (
      (prevId && (tc[prevId] || 0) > 0) ||
      (nextId && (tc[nextId] || 0) > 0) ||
      (prev2Id && prevId && (tc[prev2Id] || 0) > 0 && (tc[prevId] || 0) > 0)
    ) {
      useful.push(candidate)
    }
  }

  return useful
}

/**
 * Get remaining count for a specific tile given visible tiles.
 */
export function remainingCount(
  tile: Tile,
  handCounts: TileCounts,
  discardCounts: TileCounts,
): number {
  const id = tileId(tile)
  const inHand = handCounts[id] || 0
  const discarded = discardCounts[id] || 0
  return Math.max(0, 4 - inHand - discarded)
}
