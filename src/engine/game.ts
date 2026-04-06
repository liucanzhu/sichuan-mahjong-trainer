import {
  type Tile,
  type Suit,
  type TileCounts,
  createFullDeck,
  shuffleDeck,
  sortTiles,
  tileId,
  SUITS,
  removeTile,
} from './tiles'
import { isWinningHand } from './hand'
import { findWaitingTiles } from './waiting'

export interface Player {
  hand: Tile[]
  discards: Tile[]
  missingSuit: Suit | null
  melds: Tile[][] // open melds (碰/杠)
}

export interface GameState {
  wall: Tile[]
  players: Player[]
  currentPlayer: number
  turnNumber: number
}

/**
 * Create a fresh game state: shuffle, deal 13 tiles to each player.
 */
export function createGame(): GameState {
  let deck = shuffleDeck(createFullDeck())
  const players: Player[] = []

  for (let i = 0; i < 4; i++) {
    const hand = sortTiles(deck.slice(0, 13))
    deck = deck.slice(13)
    players.push({
      hand,
      discards: [],
      missingSuit: null,
      melds: [],
    })
  }

  return {
    wall: deck,
    players,
    currentPlayer: 0,
    turnNumber: 0,
  }
}

/**
 * Choose which suit to lack (缺一门) based on hand composition.
 * Strategy: lack the suit with fewest tiles.
 */
export function chooseMissingSuit(hand: Tile[]): Suit {
  const suitCount: Record<Suit, number> = { wan: 0, tiao: 0, tong: 0 }
  for (const t of hand) {
    suitCount[t.suit]++
  }
  let minSuit: Suit = 'wan'
  let minCount = Infinity
  for (const suit of SUITS) {
    if (suitCount[suit] < minCount) {
      minCount = suitCount[suit]
      minSuit = suit
    }
  }
  return minSuit
}

/**
 * Perform 换三张: exchange 3 tiles of the suit to be lacked.
 */
export function performExchange(game: GameState): GameState {
  const newPlayers = game.players.map((p) => {
    const missingSuit = chooseMissingSuit(p.hand)
    const toExchange = p.hand.filter((t) => t.suit === missingSuit).slice(0, 3)
    let remaining = [...p.hand]
    for (const t of toExchange) {
      remaining = removeTile(remaining, t)
    }
    return { ...p, hand: remaining, missingSuit, _exchange: toExchange }
  }) as (Player & { _exchange: Tile[] })[]

  // Rotate exchanges: player i gives to player (i+1) % 4
  const result = newPlayers.map((p, i) => {
    const giver = (i + 3) % 4 // receive from previous player
    const received = newPlayers[giver]._exchange
    const newHand = sortTiles([...p.hand, ...received])
    const { _exchange: _, ...player } = { ...p, hand: newHand }
    return player
  })

  return { ...game, players: result }
}

/**
 * Draw a tile from the wall for the current player.
 */
export function drawTile(game: GameState): { game: GameState; tile: Tile } | null {
  if (game.wall.length === 0) {
    return null
  }

  const tile = game.wall[0]
  const newWall = game.wall.slice(1)
  const newPlayers = [...game.players]
  const player = { ...newPlayers[game.currentPlayer] }
  player.hand = sortTiles([...player.hand, tile])
  newPlayers[game.currentPlayer] = player

  return {
    game: { ...game, wall: newWall, players: newPlayers },
    tile,
  }
}

/**
 * Discard a tile from the current player's hand.
 */
export function discardTile(game: GameState, tile: Tile): GameState {
  const newPlayers = [...game.players]
  const player = { ...newPlayers[game.currentPlayer] }
  player.hand = removeTile(player.hand, tile)
  player.discards = [...player.discards, tile]
  newPlayers[game.currentPlayer] = player

  return {
    ...game,
    players: newPlayers,
    currentPlayer: (game.currentPlayer + 1) % 4,
    turnNumber: game.turnNumber + 1,
  }
}

/**
 * Generate a mid-game scenario for training.
 * Simulates N turns of random play and returns the state.
 */
export function generateMidGameScenario(turnsPlayed: number = 8): GameState {
  let game = createGame()
  game = performExchange(game)

  for (let turn = 0; turn < turnsPlayed; turn++) {
    const result = drawTile(game)
    if (!result) {
      break
    }
    game = result.game

    const player = game.players[game.currentPlayer]
    // AI: discard a tile from the missing suit first, then random
    const missingSuitTiles = player.hand.filter(
      (t) => t.suit === player.missingSuit,
    )
    const toDiscard =
      missingSuitTiles.length > 0
        ? missingSuitTiles[Math.floor(Math.random() * missingSuitTiles.length)]
        : player.hand[Math.floor(Math.random() * player.hand.length)]

    game = discardTile(game, toDiscard)
  }

  return game
}

/**
 * Count all visible tiles from a player's perspective.
 */
export function getVisibleTileCounts(
  game: GameState,
  playerIndex: number,
): TileCounts {
  const counts: TileCounts = {}

  const addTile = (t: Tile) => {
    const id = tileId(t)
    counts[id] = (counts[id] || 0) + 1
  }

  // Own hand
  for (const t of game.players[playerIndex].hand) {
    addTile(t)
  }

  // All discards
  for (const p of game.players) {
    for (const t of p.discards) {
      addTile(t)
    }
    // Open melds
    for (const meld of p.melds) {
      for (const t of meld) {
        addTile(t)
      }
    }
  }

  return counts
}

/**
 * Generate a hand suitable for waiting training.
 * Returns a 13-tile hand that is in tenpai (听牌).
 */
export function generateTenpaiHand(
  options: { flush?: boolean; difficulty?: 'easy' | 'medium' | 'hard' } = {},
): Tile[] {
  const { flush = false, difficulty = 'medium' } = options
  const maxAttempts = 1000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let deck = shuffleDeck(createFullDeck())

    if (flush) {
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)]
      deck = deck.filter((t) => t.suit === suit)
    }

    const hand = sortTiles(deck.slice(0, 14))

    if (isWinningHand(hand)) {
      const idx = Math.floor(Math.random() * hand.length)
      const tenpaiHand = [...hand]
      tenpaiHand.splice(idx, 1)

      const waiting = findWaitingTiles(tenpaiHand)

      if (waiting.length > 0) {
        if (difficulty === 'easy' && waiting.length <= 2) {
          return tenpaiHand
        }
        if (difficulty === 'medium' && waiting.length >= 2 && waiting.length <= 5) {
          return tenpaiHand
        }
        if (difficulty === 'hard' && waiting.length >= 3) {
          return tenpaiHand
        }
        return tenpaiHand
      }
    }
  }

  // Fallback: return a simple tenpai hand
  return [
    { suit: 'wan', value: 1 }, { suit: 'wan', value: 2 }, { suit: 'wan', value: 3 },
    { suit: 'wan', value: 4 }, { suit: 'wan', value: 5 }, { suit: 'wan', value: 6 },
    { suit: 'tiao', value: 2 }, { suit: 'tiao', value: 3 }, { suit: 'tiao', value: 4 },
    { suit: 'tong', value: 5 }, { suit: 'tong', value: 5 }, { suit: 'tong', value: 5 },
    { suit: 'tong', value: 9 },
  ]
}
