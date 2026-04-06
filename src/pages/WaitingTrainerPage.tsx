import { useState, useCallback, useMemo } from 'react'
import {
  type Tile as TileType,
  tileId,
  tileShortLabel,
  SUITS,
  sortTiles,
  shuffleDeck,
  createFullDeck,
  allUniqueTiles,
} from '../engine/tiles'
import { isWinningHand } from '../engine/hand'
import { findWaitingTiles, analyzeAllDiscards } from '../engine/waiting'
import Hand from '../components/Hand'
import TileComp from '../components/Tile'
import ResultBanner from '../components/ResultBanner'
import { useProgressStore } from '../store/progress'

type Mode = 'find-waiting' | 'best-discard'
type Difficulty = 'normal' | 'flush' | 'complex'

function generateHand(difficulty: Difficulty): { hand: TileType[]; drawn: TileType } | null {
  const maxAttempts = 2000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let deck = shuffleDeck(createFullDeck())

    if (difficulty === 'flush') {
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)]
      deck = deck.filter((t) => t.suit === suit)
    }

    const candidate = sortTiles(deck.slice(0, 14))

    // For 'find-waiting': need a tenpai hand (13 tiles)
    // For 'best-discard': need a 14-tile hand close to tenpai
    if (isWinningHand(candidate)) {
      const idx = Math.floor(Math.random() * candidate.length)
      const hand13 = [...candidate]
      const removed = hand13.splice(idx, 1)[0]
      const waiting = findWaitingTiles(hand13)

      if (waiting.length > 0) {
        if (difficulty === 'normal' && waiting.length <= 3) {
          return { hand: hand13, drawn: removed }
        }
        if (difficulty === 'flush' && waiting.length >= 2) {
          return { hand: hand13, drawn: removed }
        }
        if (difficulty === 'complex' && waiting.length >= 3) {
          return { hand: hand13, drawn: removed }
        }
        return { hand: hand13, drawn: removed }
      }
    }

    // Try taking 14 tiles and checking discard options
    const analyses = analyzeAllDiscards(candidate)
    if (analyses.length > 0 && analyses[0].waiting.waitingTiles.length > 0) {
      // Use first 13 as hand, 14th as drawn
      return { hand: sortTiles(candidate.slice(0, 13)), drawn: candidate[13] }
    }
  }

  // Fallback
  return {
    hand: [
      { suit: 'wan', value: 1 }, { suit: 'wan', value: 2 }, { suit: 'wan', value: 3 },
      { suit: 'wan', value: 4 }, { suit: 'wan', value: 5 }, { suit: 'wan', value: 6 },
      { suit: 'tiao', value: 2 }, { suit: 'tiao', value: 3 }, { suit: 'tiao', value: 4 },
      { suit: 'tong', value: 5 }, { suit: 'tong', value: 5 }, { suit: 'tong', value: 5 },
      { suit: 'tong', value: 9 },
    ],
    drawn: { suit: 'wan', value: 7 },
  }
}

export default function WaitingTrainerPage() {
  const [mode, setMode] = useState<Mode>('find-waiting')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [handData, setHandData] = useState(() => generateHand('normal'))
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set())
  const [selectedDiscard, setSelectedDiscard] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const addRecord = useProgressStore((s) => s.addRecord)

  const correctWaiting = useMemo(() => {
    if (!handData) {
      return []
    }
    return findWaitingTiles(handData.hand)
  }, [handData])

  const discardAnalyses = useMemo(() => {
    if (!handData) {
      return []
    }
    const full14 = sortTiles([...handData.hand, handData.drawn])
    return analyzeAllDiscards(full14)
  }, [handData])

  const bestDiscard = discardAnalyses.length > 0 ? discardAnalyses[0] : null

  const newProblem = useCallback(() => {
    const data = generateHand(difficulty)
    setHandData(data)
    setSelectedTiles(new Set())
    setSelectedDiscard(null)
    setSubmitted(false)
  }, [difficulty])

  const handleTileSelect = (tile: TileType) => {
    if (submitted) {
      return
    }
    const id = tileId(tile)
    const next = new Set(selectedTiles)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedTiles(next)
  }

  const handleDiscardSelect = (tile: TileType, _index: number) => {
    if (submitted) {
      return
    }
    setSelectedDiscard(tileId(tile) + '-' + _index)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correctIds = new Set(correctWaiting.map((t) => tileId(t)))
    const isCorrect =
      mode === 'find-waiting'
        ? selectedTiles.size === correctIds.size &&
          [...selectedTiles].every((id) => correctIds.has(id))
        : selectedDiscard !== null &&
          bestDiscard !== null &&
          selectedDiscard.startsWith(tileId(bestDiscard.discard))

    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1,
    }
    setScore(newScore)

    if (newScore.total % 5 === 0) {
      addRecord({
        date: new Date().toISOString().slice(0, 10),
        type: 'waiting',
        correct: newScore.correct,
        total: newScore.total,
        timeSpentMs: 0,
      })
    }
  }

  if (!handData) {
    return <div className="py-4">加载中...</div>
  }

  const correctIds = new Set(correctWaiting.map((t) => tileId(t)))

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">理叫训练</h1>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1">
            {([['find-waiting', '找听口'], ['best-discard', '选弃牌']] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); newProblem() }}
                className={`px-3 py-1 rounded text-sm ${
                  mode === m ? 'bg-[#f4a261] text-black font-bold' : 'bg-[#1a5c2e]/50 text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {([['normal', '普通'], ['flush', '清一色'], ['complex', '复杂']] as const).map(([d, label]) => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); newProblem() }}
                className={`px-3 py-1 rounded text-sm ${
                  difficulty === d ? 'bg-[#457b9d] text-white font-bold' : 'bg-[#1a5c2e]/50 text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40 mb-4">
        {mode === 'find-waiting' ? (
          <>
            <Hand tiles={handData.hand} label="手牌（13张）- 这手牌听什么？" />
            <div className="mt-4 text-sm text-gray-400 mb-2">
              点击下方的牌选择你认为的听口：
            </div>
            <div className="flex flex-wrap gap-1">
              {allUniqueTiles()
                .filter((t) => handData.hand.some((h) => h.suit === t.suit) || correctWaiting.some((w) => w.suit === t.suit))
                .map((tile) => {
                  const id = tileId(tile)
                  const isSelected = selectedTiles.has(id)
                  const isCorrectTile = correctIds.has(id)
                  return (
                    <div key={id} className="relative">
                      <TileComp
                        tile={tile}
                        size="sm"
                        selected={isSelected}
                        highlighted={submitted && isCorrectTile}
                        dimmed={submitted && isSelected && !isCorrectTile}
                        onClick={() => handleTileSelect(tile)}
                      />
                      {submitted && isCorrectTile && !isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#e74c3c] rounded-full" />
                      )}
                    </div>
                  )
                })}
            </div>
          </>
        ) : (
          <>
            <Hand
              tiles={handData.hand}
              drawnTile={handData.drawn}
              label="手牌（14张）- 打哪张最优？"
              onTileClick={(tile, idx) => handleDiscardSelect(tile, idx)}
              selectedTileId={selectedDiscard}
            />
          </>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={mode === 'find-waiting' ? selectedTiles.size === 0 : !selectedDiscard}
            className="px-5 py-2 bg-[#f4a261] text-black rounded font-bold hover:bg-[#e8964e] disabled:opacity-40"
          >
            提交答案
          </button>
        ) : (
          <button
            onClick={newProblem}
            className="px-5 py-2 bg-[#1a5c2e] text-white rounded font-bold hover:bg-[#2a7a4e]"
          >
            下一题
          </button>
        )}
      </div>

      {submitted && mode === 'find-waiting' && (
        <div className="space-y-3">
          <ResultBanner
            correct={
              selectedTiles.size === correctIds.size &&
              [...selectedTiles].every((id) => correctIds.has(id))
            }
            message={
              selectedTiles.size === correctIds.size &&
              [...selectedTiles].every((id) => correctIds.has(id))
                ? '完全正确！'
                : '有误'
            }
            detail={`正确听口：${correctWaiting.map((t) => tileShortLabel(t)).join('、')}（共${correctWaiting.length}面听）`}
          />
        </div>
      )}

      {submitted && mode === 'best-discard' && bestDiscard && (
        <div className="space-y-3">
          <ResultBanner
            correct={selectedDiscard?.startsWith(tileId(bestDiscard.discard)) ?? false}
            message={
              selectedDiscard?.startsWith(tileId(bestDiscard.discard))
                ? '选择正确！'
                : `最优弃牌是 ${tileShortLabel(bestDiscard.discard)}`
            }
            detail={`听 ${bestDiscard.waiting.waitingTiles.map((t) => tileShortLabel(t)).join('、')}，共${bestDiscard.waiting.waitingTiles.length}面听，剩余${bestDiscard.waiting.totalRemaining}张`}
          />
          <div className="bg-[#0d2818] rounded-xl p-4 border border-[#1a5c2e]/40">
            <div className="text-sm text-gray-400 mb-2">所有弃牌选项分析：</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {discardAnalyses.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded ${
                    i === 0 ? 'bg-[#1a5c2e]/30' : ''
                  }`}
                >
                  <TileComp tile={a.discard} size="sm" />
                  <span className="text-sm">
                    → 听{' '}
                    {a.waiting.waitingTiles.length > 0
                      ? a.waiting.waitingTiles.map((t) => tileShortLabel(t)).join('、')
                      : '无'}
                    {a.waiting.waitingTiles.length > 0 && (
                      <span className="text-gray-500">
                        {' '}({a.waiting.waitingTiles.length}面，余{a.waiting.totalRemaining}张)
                      </span>
                    )}
                  </span>
                  {i === 0 && (
                    <span className="text-[#f4a261] text-xs font-bold ml-auto">最优</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        本轮成绩：{score.correct}/{score.total}
        {score.total > 0 && ` (${Math.round((score.correct / score.total) * 100)}%)`}
      </div>
    </div>
  )
}
