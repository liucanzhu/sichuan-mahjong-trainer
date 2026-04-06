import {
  type Tile,
  type Suit,
  type TileCounts,
  countTiles,
  SUITS,
  VALUES,
} from './tiles'

/**
 * Check if a set of tiles (given as counts within one suit) can be
 * decomposed into melds (sequences/triplets) using backtracking.
 * This is critical for flush (清一色) hands where greedy fails.
 */
function canDecomposeMelds(counts: number[]): boolean {
  const first = counts.findIndex((c) => c > 0)
  if (first === -1) {
    return true
  }

  // Try triplet (刻子)
  if (counts[first] >= 3) {
    counts[first] -= 3
    if (canDecomposeMelds(counts)) {
      counts[first] += 3
      return true
    }
    counts[first] += 3
  }

  // Try sequence (顺子)
  if (first <= 6 && counts[first + 1] >= 1 && counts[first + 2] >= 1) {
    counts[first] -= 1
    counts[first + 1] -= 1
    counts[first + 2] -= 1
    if (canDecomposeMelds(counts)) {
      counts[first] += 1
      counts[first + 1] += 1
      counts[first + 2] += 1
      return true
    }
    counts[first] += 1
    counts[first + 1] += 1
    counts[first + 2] += 1
  }

  return false
}

/**
 * Build a 9-element array of counts for a given suit from TileCounts.
 */
function suitCounts(tileCounts: TileCounts, suit: Suit): number[] {
  const arr = new Array(9).fill(0)
  for (let v = 1; v <= 9; v++) {
    arr[v - 1] = tileCounts[`${suit}${v}`] || 0
  }
  return arr
}

/**
 * Check if a hand of 14 tiles (or 2/5/8/11) forms a winning hand.
 * Standard form: N melds + 1 pair (将).
 */
export function isWinningHand(tiles: Tile[]): boolean {
  if (tiles.length % 3 !== 2) {
    return false
  }

  // Seven pairs (七对)
  if (tiles.length === 14 && isSevenPairs(tiles)) {
    return true
  }

  const tc = countTiles(tiles)

  // Try every possible pair as the 将
  const tried = new Set<string>()
  for (const suit of SUITS) {
    for (const v of VALUES) {
      const id = `${suit}${v}`
      if (tried.has(id)) {
        continue
      }
      tried.add(id)
      const count = tc[id] || 0
      if (count < 2) {
        continue
      }

      // Remove pair and check remaining can be decomposed
      const remaining = { ...tc }
      remaining[id] -= 2
      if (remaining[id] === 0) {
        delete remaining[id]
      }
      if (canDecomposeAll(remaining)) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if all remaining tiles (after removing pair) can form melds.
 * Each suit is checked independently since cross-suit sequences don't exist in mahjong.
 */
function canDecomposeAll(tc: TileCounts): boolean {
  for (const suit of SUITS) {
    const counts = suitCounts(tc, suit)
    if (!canDecomposeMelds(counts)) {
      return false
    }
  }
  return true
}

export function isSevenPairs(tiles: Tile[]): boolean {
  if (tiles.length !== 14) {
    return false
  }
  const tc = countTiles(tiles)
  const values = Object.values(tc)
  return values.length === 7 && values.every((c) => c === 2)
}

export function isAllTriplets(tiles: Tile[]): boolean {
  if (tiles.length !== 14) {
    return false
  }
  const tc = countTiles(tiles)
  const values = Object.values(tc)
  const pairCount = values.filter((c) => c === 2).length
  const tripletCount = values.filter((c) => c === 3).length
  return pairCount === 1 && tripletCount === 4
}

/**
 * Check if all tiles are of a single suit (清一色).
 */
export function isFlush(tiles: Tile[]): boolean {
  if (tiles.length === 0) {
    return false
  }
  const suit = tiles[0].suit
  return tiles.every((t) => t.suit === suit)
}

/**
 * Count how many suits are used in the hand.
 */
export function suitsUsed(tiles: Tile[]): Suit[] {
  const s = new Set<Suit>()
  for (const t of tiles) {
    s.add(t.suit)
  }
  return [...s]
}

/**
 * Check 缺一门: hand must not contain all three suits.
 */
export function hasQueYiMen(tiles: Tile[]): boolean {
  return suitsUsed(tiles).length <= 2
}

/**
 * Check 将对: all triplets/pairs with pair being 2/5/8.
 */
export function isJiangDui(tiles: Tile[]): boolean {
  if (tiles.length !== 14) {
    return false
  }
  const tc = countTiles(tiles)
  const entries = Object.entries(tc)
  const pairEntry = entries.find(([, c]) => c === 2)
  if (!pairEntry) {
    return false
  }
  const allTripletsOrPair = entries.every(([, c]) => c === 2 || c === 3)
  if (!allTripletsOrPair) {
    return false
  }
  const pairTile = parseTileIdLocal(pairEntry[0])
  return [2, 5, 8].includes(pairTile.value)
}

function parseTileIdLocal(id: string): { suit: Suit; value: number } {
  const suit = id.replace(/[0-9]/g, '') as Suit
  const value = parseInt(id.replace(/[^0-9]/g, ''), 10)
  return { suit, value }
}

/**
 * Check 金钩钓: hand has 4 triplets and a single tile (单骑).
 * This happens when all other tiles are in melds (碰/杠) and hand has 1 tile + drawn 1.
 * For simplicity: 13 tiles with 4 triplets and 1 pair, winning by self-draw on the pair.
 */
export function isGoldenHook(tiles: Tile[]): boolean {
  if (tiles.length !== 14) {
    return false
  }
  const tc = countTiles(tiles)
  const values = Object.values(tc)
  const pairCount = values.filter((c) => c === 2).length
  const tripletCount = values.filter((c) => c >= 3).length
  return pairCount === 1 && tripletCount === 4 && values.length === 5
}

export { suitCounts, canDecomposeMelds }
