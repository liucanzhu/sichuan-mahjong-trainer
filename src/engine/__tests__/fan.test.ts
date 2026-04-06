import { describe, it, expect } from 'vitest'
import type { Tile } from '../tiles'
import { calculateFan } from '../fan'

function t(suit: 'wan' | 'tiao' | 'tong', value: number): Tile {
  return { suit, value }
}

describe('calculateFan', () => {
  it('calculates 0 fan for basic win without self-draw', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 2), t('wan', 3),
      t('tiao', 4), t('tiao', 5), t('tiao', 6),
      t('tong', 7), t('tong', 8), t('tong', 9),
      t('wan', 5), t('wan', 5), t('wan', 5),
      t('tiao', 1), t('tiao', 1),
    ]
    const result = calculateFan(hand, false)
    expect(result.totalFan).toBe(0)
  })

  it('adds 1 fan for self-draw', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 2), t('wan', 3),
      t('tiao', 4), t('tiao', 5), t('tiao', 6),
      t('tong', 7), t('tong', 8), t('tong', 9),
      t('wan', 5), t('wan', 5), t('wan', 5),
      t('tiao', 1), t('tiao', 1),
    ]
    const result = calculateFan(hand, true)
    expect(result.totalFan).toBe(1)
    expect(result.fans.some((f) => f.name === '自摸')).toBe(true)
  })

  it('calculates 2 fan for flush', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 2), t('wan', 3),
      t('wan', 4), t('wan', 5), t('wan', 6),
      t('wan', 7), t('wan', 8), t('wan', 9),
      t('wan', 1), t('wan', 2), t('wan', 3),
      t('wan', 5), t('wan', 5),
    ]
    const result = calculateFan(hand, false)
    expect(result.fans.some((f) => f.name === '清一色')).toBe(true)
    expect(result.totalFan).toBeGreaterThanOrEqual(2)
  })

  it('calculates 2 fan for seven pairs', () => {
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1),
      t('wan', 3), t('wan', 3),
      t('tiao', 5), t('tiao', 5),
      t('tong', 7), t('tong', 7),
      t('wan', 9), t('wan', 9),
      t('tiao', 2), t('tiao', 2),
      t('tong', 4), t('tong', 4),
    ]
    const result = calculateFan(hand, false)
    expect(result.fans.some((f) => f.name === '七对')).toBe(true)
    expect(result.totalFan).toBe(2)
  })

  it('caps at 4 fan', () => {
    // Flush + seven pairs + self-draw = 2+2+1 = 5, should cap at 4
    const hand: Tile[] = [
      t('wan', 1), t('wan', 1),
      t('wan', 2), t('wan', 2),
      t('wan', 3), t('wan', 3),
      t('wan', 4), t('wan', 4),
      t('wan', 5), t('wan', 5),
      t('wan', 6), t('wan', 6),
      t('wan', 7), t('wan', 7),
    ]
    const result = calculateFan(hand, true)
    expect(result.totalFan).toBe(4)
    expect(result.capped).toBe(true)
  })
})
