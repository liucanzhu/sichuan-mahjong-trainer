import { describe, it, expect } from 'vitest'
import type { Tile } from '../tiles'
import { tileId } from '../tiles'
import { findWaitingTiles, analyzeAllDiscards } from '../waiting'

function t(suit: 'wan' | 'tiao' | 'tong', value: number): Tile {
  return { suit, value }
}

describe('findWaitingTiles', () => {
  it('finds two-sided waiting', () => {
    // 123万 456条 789筒 55万 + need 将 or meld
    // hand: 12万 456条 789筒 555万 → 13 tiles, waiting for 3万
    const hand: Tile[] = [
      t('wan', 1), t('wan', 2),
      t('tiao', 4), t('tiao', 5), t('tiao', 6),
      t('tong', 7), t('tong', 8), t('tong', 9),
      t('wan', 5), t('wan', 5), t('wan', 5),
      t('tiao', 1), t('tiao', 1),
    ]
    const waiting = findWaitingTiles(hand)
    const ids = waiting.map((w) => tileId(w))
    expect(ids).toContain('wan3')
  })

  it('finds waiting for seven pairs', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1),
      t('wan', 3), t('wan', 3),
      t('tiao', 5), t('tiao', 5),
      t('tong', 7), t('tong', 7),
      t('wan', 9), t('wan', 9),
      t('tiao', 2), t('tiao', 2),
      t('tong', 4),
    ]
    const waiting = findWaitingTiles(hand)
    const ids = waiting.map((w) => tileId(w))
    expect(ids).toContain('tong4')
  })

  it('finds multiple waiting tiles for flush hand', () => {
    // 2345678 万 + 111万 + 99万 = 13 tiles
    // Can hear 1,4,7 (or other depending on decomposition)
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1), t('wan', 1),
      t('wan', 2), t('wan', 3), t('wan', 4),
      t('wan', 5), t('wan', 6), t('wan', 7),
      t('wan', 8),
      t('wan', 9), t('wan', 9), t('wan', 9),
    ]
    const waiting = findWaitingTiles(hand)
    expect(waiting.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty for non-tenpai hand', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 3), t('wan', 5),
      t('tiao', 2), t('tiao', 4), t('tiao', 6),
      t('tong', 1), t('tong', 3), t('tong', 5),
      t('wan', 7), t('wan', 9),
      t('tiao', 8), t('tong', 9),
    ]
    const waiting = findWaitingTiles(hand)
    expect(waiting.length).toBe(0)
  })
})

describe('analyzeAllDiscards', () => {
  it('returns sorted analyses for a 14-tile hand', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 2), t('wan', 3),
      t('tiao', 4), t('tiao', 5), t('tiao', 6),
      t('tong', 7), t('tong', 8), t('tong', 9),
      t('wan', 5), t('wan', 5), t('wan', 5),
      t('tiao', 1), t('tiao', 1),
    ]
    const analyses = analyzeAllDiscards(hand)
    expect(analyses.length).toBeGreaterThan(0)
    // Should be sorted by efficiency (descending)
    for (let i = 1; i < analyses.length; i++) {
      expect(analyses[i - 1].efficiency).toBeGreaterThanOrEqual(analyses[i].efficiency)
    }
  })
})
