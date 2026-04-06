import { useState, useMemo } from 'react'
import {
  type Tile as TileType,
  tileId,
  tileShortLabel,
  SUITS,
  VALUES,
  sortTiles,
  shuffleDeck,
  createFullDeck,
  allUniqueTiles,
} from '../engine/tiles'
import { isWinningHand } from '../engine/hand'
import { findWaitingTiles } from '../engine/waiting'
import { generateMidGameScenario, getVisibleTileCounts } from '../engine/game'
import Hand from '../components/Hand'
import DiscardPool from '../components/DiscardPool'
import TileComp from '../components/Tile'
import ResultBanner from '../components/ResultBanner'
import { useProgressStore } from '../store/progress'

interface Challenge {
  type: 'card-count' | 'waiting'
  // card-count fields
  game?: ReturnType<typeof generateMidGameScenario>
  questionTile?: TileType
  questionAnswer?: number
  // waiting fields
  hand?: TileType[]
  correctWaiting?: TileType[]
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateDailyChallenges(dateStr: string): Challenge[] {
  const seed = dateStr.split('-').reduce((a, b) => a * 100 + parseInt(b, 10), 0)
  const rng = seededRandom(seed)
  const challenges: Challenge[] = []

  // 5 card counting challenges
  for (let i = 0; i < 5; i++) {
    const turns = Math.floor(rng() * 10) + 6
    const game = generateMidGameScenario(turns)
    const visible = getVisibleTileCounts(game, 0)
    const suit = SUITS[Math.floor(rng() * SUITS.length)]
    const value = VALUES[Math.floor(rng() * VALUES.length)]
    const tile: TileType = { suit, value }
    const seen = visible[tileId(tile)] || 0
    challenges.push({
      type: 'card-count',
      game,
      questionTile: tile,
      questionAnswer: 4 - seen,
    })
  }

  // 5 waiting challenges
  for (let i = 0; i < 5; i++) {
    let deck = shuffleDeck(createFullDeck())
    let found = false
    for (let attempt = 0; attempt < 500; attempt++) {
      deck = shuffleDeck(createFullDeck())
      const hand14 = sortTiles(deck.slice(0, 14))
      if (isWinningHand(hand14)) {
        const idx = Math.floor(rng() * 14)
        const hand13 = [...hand14]
        hand13.splice(idx, 1)
        const waiting = findWaitingTiles(hand13)
        if (waiting.length > 0) {
          challenges.push({
            type: 'waiting',
            hand: hand13,
            correctWaiting: waiting,
          })
          found = true
          break
        }
      }
    }
    if (!found) {
      const fallback: TileType[] = [
        { suit: 'wan', value: 1 }, { suit: 'wan', value: 2 }, { suit: 'wan', value: 3 },
        { suit: 'tiao', value: 4 }, { suit: 'tiao', value: 5 }, { suit: 'tiao', value: 6 },
        { suit: 'tong', value: 7 }, { suit: 'tong', value: 8 }, { suit: 'tong', value: 9 },
        { suit: 'wan', value: 7 }, { suit: 'wan', value: 7 }, { suit: 'wan', value: 7 },
        { suit: 'tiao', value: 1 },
      ]
      challenges.push({
        type: 'waiting',
        hand: fallback,
        correctWaiting: findWaitingTiles(fallback),
      })
    }
  }

  return challenges
}

export default function DailyChallengePage() {
  const today = new Date().toISOString().slice(0, 10)
  const challenges = useMemo(() => generateDailyChallenges(today), [today])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [startTime] = useState(Date.now())
  const { addRecord, updateDailyStreak, dailyStreak } = useProgressStore()

  const challenge = challenges[currentIdx]
  const isComplete = currentIdx >= challenges.length

  const handleSubmitCardCount = () => {
    const ans = parseInt(userAnswer, 10)
    const correct = ans === challenge.questionAnswer
    setSubmitted(true)
    setResults([...results, correct])
  }

  const handleSubmitWaiting = () => {
    const correctIds = new Set(challenge.correctWaiting!.map((t) => tileId(t)))
    const correct =
      selectedTiles.size === correctIds.size &&
      [...selectedTiles].every((id) => correctIds.has(id))
    setSubmitted(true)
    setResults([...results, correct])
  }

  const handleNext = () => {
    const nextIdx = currentIdx + 1
    setCurrentIdx(nextIdx)
    setUserAnswer('')
    setSelectedTiles(new Set())
    setSubmitted(false)

    if (nextIdx >= challenges.length) {
      const correctCount = results.length > 0 ? results.filter(Boolean).length : 0
      addRecord({
        date: today,
        type: 'daily',
        correct: correctCount,
        total: challenges.length,
        timeSpentMs: Date.now() - startTime,
      })
      updateDailyStreak(today)
    }
  }

  if (isComplete) {
    const correctCount = results.filter(Boolean).length
    return (
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-6">每日挑战完成！</h1>
        <div className="bg-[#0d2818] rounded-xl p-8 border border-[#1a5c2e]/40 text-center">
          <div className="text-5xl mb-4">
            {correctCount >= 8 ? '🏆' : correctCount >= 5 ? '👍' : '💪'}
          </div>
          <div className="text-3xl font-bold text-[#f4a261] mb-2">
            {correctCount}/{challenges.length}
          </div>
          <div className="text-gray-400 mb-4">
            正确率 {Math.round((correctCount / challenges.length) * 100)}%
          </div>
          <div className="text-sm text-gray-500">
            连续打卡 {dailyStreak} 天
          </div>
          <div className="mt-4 text-sm text-gray-500">
            用时 {Math.round((Date.now() - startTime) / 60000)} 分钟
          </div>
          <div className="mt-4 flex gap-2 justify-center">
            {results.map((r, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  r ? 'bg-[#2ecc71]/20 text-[#2ecc71]' : 'bg-[#e74c3c]/20 text-[#e74c3c]'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">每日挑战</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            第 {currentIdx + 1}/{challenges.length} 题
          </span>
          <span className="text-sm text-[#f4a261]">
            🔥 {dailyStreak} 天
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {challenges.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < currentIdx
                ? results[i]
                  ? 'bg-[#2ecc71]'
                  : 'bg-[#e74c3c]'
                : i === currentIdx
                ? 'bg-[#f4a261]'
                : 'bg-[#1a5c2e]/30'
            }`}
          />
        ))}
      </div>

      {challenge.type === 'card-count' && challenge.game && challenge.questionTile && (
        <div className="space-y-4">
          <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40">
            <Hand tiles={challenge.game.players[0].hand} label="你的手牌" size="sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {challenge.game.players.map((p, i) => (
              <DiscardPool
                key={i}
                tiles={p.discards}
                label={i === 0 ? '你的弃牌' : `玩家${i + 1}弃牌`}
              />
            ))}
          </div>
          <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40">
            <div className="flex items-center gap-3 mb-4">
              <TileComp tile={challenge.questionTile} size="md" />
              <span className="text-lg">{tileShortLabel(challenge.questionTile)} 还剩几张？</span>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min="0"
                max="4"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-20 px-3 py-2 rounded bg-[#0a1f12] border border-[#1a5c2e] text-white text-center text-lg"
                disabled={submitted}
              />
              {!submitted ? (
                <button
                  onClick={handleSubmitCardCount}
                  className="px-4 py-2 bg-[#f4a261] text-black rounded font-bold"
                >
                  确认
                </button>
              ) : (
                <button onClick={handleNext} className="px-4 py-2 bg-[#1a5c2e] text-white rounded font-bold">
                  {currentIdx < challenges.length - 1 ? '下一题' : '查看结果'}
                </button>
              )}
            </div>
            {submitted && (
              <div className="mt-3">
                <ResultBanner
                  correct={parseInt(userAnswer, 10) === challenge.questionAnswer}
                  message={
                    parseInt(userAnswer, 10) === challenge.questionAnswer
                      ? '正确！'
                      : `正确答案：${challenge.questionAnswer}`
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {challenge.type === 'waiting' && challenge.hand && (
        <div className="space-y-4">
          <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40">
            <Hand tiles={challenge.hand} label="手牌 - 听什么？" />
          </div>
          <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40">
            <div className="text-sm text-gray-400 mb-2">选择听口：</div>
            <div className="flex flex-wrap gap-1">
              {allUniqueTiles().map((tile) => {
                const id = tileId(tile)
                return (
                  <TileComp
                    key={id}
                    tile={tile}
                    size="sm"
                    selected={selectedTiles.has(id)}
                    highlighted={submitted && challenge.correctWaiting!.some((w) => tileId(w) === id)}
                    onClick={() => {
                      if (submitted) {
                        return
                      }
                      const next = new Set(selectedTiles)
                      if (next.has(id)) {
                        next.delete(id)
                      } else {
                        next.add(id)
                      }
                      setSelectedTiles(next)
                    }}
                  />
                )
              })}
            </div>
            <div className="flex gap-3 mt-4">
              {!submitted ? (
                <button
                  onClick={handleSubmitWaiting}
                  disabled={selectedTiles.size === 0}
                  className="px-4 py-2 bg-[#f4a261] text-black rounded font-bold disabled:opacity-40"
                >
                  确认
                </button>
              ) : (
                <button onClick={handleNext} className="px-4 py-2 bg-[#1a5c2e] text-white rounded font-bold">
                  {currentIdx < challenges.length - 1 ? '下一题' : '查看结果'}
                </button>
              )}
            </div>
            {submitted && (
              <div className="mt-3">
                <ResultBanner
                  correct={(() => {
                    const correctIds = new Set(challenge.correctWaiting!.map((t) => tileId(t)))
                    return (
                      selectedTiles.size === correctIds.size &&
                      [...selectedTiles].every((id) => correctIds.has(id))
                    )
                  })()}
                  message={(() => {
                    const correctIds = new Set(challenge.correctWaiting!.map((t) => tileId(t)))
                    return selectedTiles.size === correctIds.size &&
                      [...selectedTiles].every((id) => correctIds.has(id))
                      ? '完全正确！'
                      : '有误'
                  })()}
                  detail={`正确听口：${challenge.correctWaiting!.map((t) => tileShortLabel(t)).join('、')}`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
