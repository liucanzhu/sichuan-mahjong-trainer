import { useState, useCallback } from 'react'
import {
  tileId,
  tileShortLabel,
  SUIT_LABELS,
} from '../engine/tiles'
import {
  generateMidGameScenario,
  getVisibleTileCounts,
  drawTile,
} from '../engine/game'
import { analyzeAllDiscards } from '../engine/waiting'
import Hand from '../components/Hand'
import DiscardPool from '../components/DiscardPool'
import TileComp from '../components/Tile'
import ResultBanner from '../components/ResultBanner'
import { useProgressStore } from '../store/progress'

export default function DiscardTrainerPage() {
  const [scenario, setScenario] = useState(() => createScenario())
  const [selectedDiscard, setSelectedDiscard] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const addRecord = useProgressStore((s) => s.addRecord)

  function createScenario() {
    for (let attempt = 0; attempt < 50; attempt++) {
      const game = generateMidGameScenario(Math.floor(Math.random() * 10) + 6)
      const result = drawTile(game)
      if (!result) {
        continue
      }

      const player = result.game.players[result.game.currentPlayer === 0 ? 3 : result.game.currentPlayer - 1]
      if (player.hand.length !== 14) {
        continue
      }

      const visibleCounts = getVisibleTileCounts(result.game, 0)
      const analyses = analyzeAllDiscards(player.hand, visibleCounts)
      if (analyses.length > 0 && analyses[0].waiting.waitingTiles.length > 0) {
        return { game: result.game, drawnTile: result.tile, analyses }
      }
    }

    // Fallback
    const game = generateMidGameScenario(8)
    const result = drawTile(game)!
    const analyses = analyzeAllDiscards(result.game.players[0].hand)
    return { game: result.game, drawnTile: result.tile, analyses }
  }

  const newProblem = useCallback(() => {
    setScenario(createScenario())
    setSelectedDiscard(null)
    setSubmitted(false)
  }, [])

  const player = scenario.game.players[0]
  const bestDiscard = scenario.analyses.length > 0 ? scenario.analyses[0] : null

  const handleSubmit = () => {
    setSubmitted(true)
    const isCorrect =
      selectedDiscard !== null &&
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
        type: 'discard',
        correct: newScore.correct,
        total: newScore.total,
        timeSpentMs: 0,
      })
    }
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">选打训练</h1>
        <div className="text-sm text-gray-400">
          综合考量进攻效率和防守安全，选择最优弃牌
        </div>
      </div>

      <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40 mb-4">
        <Hand
          tiles={player.hand}
          label={`你的手牌（${player.hand.length}张）${player.missingSuit ? ` - 缺${SUIT_LABELS[player.missingSuit]}` : ''}`}
          onTileClick={(tile, idx) => {
            if (!submitted) {
              setSelectedDiscard(tileId(tile) + '-' + idx)
            }
          }}
          selectedTileId={selectedDiscard}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {scenario.game.players.map((p, i) => (
          <DiscardPool
            key={i}
            tiles={p.discards}
            label={
              i === 0
                ? '你的弃牌'
                : `玩家${i + 1}弃牌${p.missingSuit ? ` (缺${SUIT_LABELS[p.missingSuit]})` : ''}`
            }
          />
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedDiscard}
            className="px-5 py-2 bg-[#f4a261] text-black rounded font-bold hover:bg-[#e8964e] disabled:opacity-40"
          >
            确认弃牌
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

      {submitted && bestDiscard && (
        <div className="space-y-3">
          <ResultBanner
            correct={selectedDiscard?.startsWith(tileId(bestDiscard.discard)) ?? false}
            message={
              selectedDiscard?.startsWith(tileId(bestDiscard.discard))
                ? '选择最优！'
                : `最优弃牌是 ${tileShortLabel(bestDiscard.discard)}`
            }
            detail={`打${tileShortLabel(bestDiscard.discard)}后听 ${bestDiscard.waiting.waitingTiles.map((t) => tileShortLabel(t)).join('、')}（${bestDiscard.waiting.waitingTiles.length}面听，余${bestDiscard.waiting.totalRemaining}张）`}
          />
          <div className="bg-[#0d2818] rounded-xl p-4 border border-[#1a5c2e]/40">
            <div className="text-sm text-gray-400 mb-2">各弃牌选项对比：</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scenario.analyses.slice(0, 8).map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded text-sm ${
                    i === 0 ? 'bg-[#1a5c2e]/30' : ''
                  }`}
                >
                  <TileComp tile={a.discard} size="sm" />
                  <span className="flex-1">
                    {a.waiting.waitingTiles.length > 0
                      ? `听 ${a.waiting.waitingTiles.map((t) => tileShortLabel(t)).join('、')} (${a.waiting.waitingTiles.length}面，余${a.waiting.totalRemaining}张)`
                      : '未听牌'}
                  </span>
                  {i === 0 && <span className="text-[#f4a261] font-bold text-xs">最优</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        成绩：{score.correct}/{score.total}
        {score.total > 0 && ` (${Math.round((score.correct / score.total) * 100)}%)`}
      </div>
    </div>
  )
}
