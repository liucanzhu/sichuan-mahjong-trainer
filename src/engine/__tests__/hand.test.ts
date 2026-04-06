import { describe, it, expect } from 'vitest'
import type { Tile } from '../tiles'
import { isWinningHand, isSevenPairs, isAllTriplets, isFlush, isJiangDui } from '../hand'

function t(suit: 'wan' | 'tiao' | 'tong', value: number): Tile {
  return { suit, value }
}

describe('isWinningHand', () => {
  it('detects a standard winning hand (4 melds + 1 pair)', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 2), t('wan', 3),
      t('tiao', 4), t('tiao', 5), t('tiao', 6),
      t('tong', 7), t('tong', 8), t('tong', 9),
      t('wan', 5), t('wan', 5), t('wan', 5),
      t('tiao', 1), t('tiao', 1),
    ]
    expect(isWinningHand(hand)).toBe(true)
  })

  it('detects all-triplets winning hand', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1), t('wan', 1),
      t('tiao', 3), t('tiao', 3), t('tiao', 3),
      t('tong', 5), t('tong', 5), t('tong', 5),
      t('wan', 9), t('wan', 9), t('wan', 9),
      t('tiao', 7), t('tiao', 7),
    ]
    expect(isWinningHand(hand)).toBe(true)
  })

  it('detects seven pairs', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1),
      t('wan', 3), t('wan', 3),
      t('tiao', 5), t('tiao', 5),
      t('tong', 7), t('tong', 7),
      t('wan', 9), t('wan', 9),
      t('tiao', 2), t('tiao', 2),
      t('tong', 4), t('tong', 4),
    ]
    expect(isWinningHand(hand)).toBe(true)
  })

  it('rejects a non-winning hand', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 2), t('wan', 4),
      t('tiao', 4), t('tiao', 5), t('tiao', 6),
      t('tong', 7), t('tong', 8), t('tong', 9),
      t('wan', 5), t('wan', 5), t('wan', 5),
      t('tiao', 1), t('tiao', 3),
    ]
    expect(isWinningHand(hand)).toBe(false)
  })

  it('handles flush winning hand with complex decomposition', () => {
    // 1112345678999 万 — should be winning
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1), t('wan', 1),
      t('wan', 2), t('wan', 3), t('wan', 4),
      t('wan', 5), t('wan', 6), t('wan', 7),
      t('wan', 8), t('wan', 9), t('wan', 9), t('wan', 9),
      t('wan', 5),
    ]
    expect(isWinningHand(hand)).toBe(true)
  })
})

describe('isSevenPairs', () => {
  it('returns true for seven pairs', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1),
      t('wan', 3), t('wan', 3),
      t('tiao', 5), t('tiao', 5),
      t('tong', 7), t('tong', 7),
      t('wan', 9), t('wan', 9),
      t('tiao', 2), t('tiao', 2),
      t('tong', 4), t('tong', 4),
    ]
    expect(isSevenPairs(hand)).toBe(true)
  })

  it('returns false for non-seven-pairs', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1), t('wan', 1),
      t('wan', 3), t('wan', 3),
      t('tiao', 5), t('tiao', 5),
      t('tong', 7), t('tong', 7),
      t('wan', 9), t('wan', 9),
      t('tiao', 2), t('tiao', 2),
      t('tong', 4),
    ]
    expect(isSevenPairs(hand)).toBe(false)
  })
})

describe('isFlush', () => {
  it('detects flush', () => {
    const hand = [t('wan', 1), t('wan', 2), t('wan', 3), t('wan', 4)]
    expect(isFlush(hand)).toBe(true)
  })

  it('rejects mixed suits', () => {
    const hand = [t('wan', 1), t('tiao', 2)]
    expect(isFlush(hand)).toBe(false)
  })
})

describe('isAllTriplets', () => {
  it('detects all triplets', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1), t('wan', 1),
      t('tiao', 3), t('tiao', 3), t('tiao', 3),
      t('tong', 5), t('tong', 5), t('tong', 5),
      t('wan', 9), t('wan', 9), t('wan', 9),
      t('tiao', 7), t('tiao', 7),
    ]
    expect(isAllTriplets(hand)).toBe(true)
  })
})

describe('isJiangDui', () => {
  it('detects 将对 with 2/5/8 pair', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1), t('wan', 1),
      t('tiao', 3), t('tiao', 3), t('tiao', 3),
      t('tong', 7), t('tong', 7), t('tong', 7),
      t('wan', 9), t('wan', 9), t('wan', 9),
      t('tiao', 2), t('tiao', 2),
    ]
    expect(isJiangDui(hand)).toBe(true)
  })

  it('rejects 将对 with non-2/5/8 pair', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1), t('wan', 1),
      t('tiao', 3), t('tiao', 3), t('tiao', 3),
      t('tong', 7), t('tong', 7), t('tong', 7),
      t('wan', 9), t('wan', 9), t('wan', 9),
      t('tiao', 1), t('tiao', 1),
    ]
    expect(isJiangDui(hand)).toBe(false)
  })
})
