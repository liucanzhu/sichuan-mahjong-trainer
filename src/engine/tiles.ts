export type Suit = 'wan' | 'tiao' | 'tong'

export interface Tile {
  suit: Suit
  value: number // 1-9
}

export type TileId = string // e.g. "wan1", "tiao5", "tong9"

export function tileId(t: Tile): TileId {
  return `${t.suit}${t.value}`
}

export function parseTileId(id: TileId): Tile {
  const suit = id.replace(/[0-9]/g, '') as Suit
  const value = parseInt(id.replace(/[^0-9]/g, ''), 10)
  return { suit, value }
}

export const SUITS: Suit[] = ['wan', 'tiao', 'tong']
export const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const SUIT_LABELS: Record<Suit, string> = {
  wan: '万',
  tiao: '条',
  tong: '筒',
}

export const VALUE_LABELS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

export function tileLabel(t: Tile): string {
  return `${VALUE_LABELS[t.value]}${SUIT_LABELS[t.suit]}`
}

export function tileShortLabel(t: Tile): string {
  return `${t.value}${SUIT_LABELS[t.suit]}`
}

export function allUniqueTiles(): Tile[] {
  const tiles: Tile[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      tiles.push({ suit, value })
    }
  }
  return tiles
}

export function createFullDeck(): Tile[] {
  const deck: Tile[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      for (let i = 0; i < 4; i++) {
        deck.push({ suit, value })
      }
    }
  }
  return deck
}

export function shuffleDeck(deck: Tile[]): Tile[] {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value
}

export function compareTiles(a: Tile, b: Tile): number {
  const suitOrder = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
  if (suitOrder !== 0) {
    return suitOrder
  }
  return a.value - b.value
}

export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort(compareTiles)
}

export type TileCounts = Record<TileId, number>

export function countTiles(tiles: Tile[]): TileCounts {
  const counts: TileCounts = {}
  for (const t of tiles) {
    const id = tileId(t)
    counts[id] = (counts[id] || 0) + 1
  }
  return counts
}

export function countsToTiles(counts: TileCounts): Tile[] {
  const tiles: Tile[] = []
  for (const [id, count] of Object.entries(counts)) {
    const tile = parseTileId(id)
    for (let i = 0; i < count; i++) {
      tiles.push({ ...tile })
    }
  }
  return sortTiles(tiles)
}

export function removeTile(tiles: Tile[], target: Tile): Tile[] {
  const idx = tiles.findIndex((t) => tilesEqual(t, target))
  if (idx === -1) {
    return tiles
  }
  const result = [...tiles]
  result.splice(idx, 1)
  return result
}

export function addTile(tiles: Tile[], tile: Tile): Tile[] {
  return sortTiles([...tiles, tile])
}

export function tileCountBySuit(tiles: Tile[], suit: Suit): number {
  return tiles.filter((t) => t.suit === suit).length
}

export function uniqueTileCountBySuit(tiles: Tile[], suit: Suit): TileCounts {
  return countTiles(tiles.filter((t) => t.suit === suit))
}
