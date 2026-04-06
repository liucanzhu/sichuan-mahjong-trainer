import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type Tile as TileType,
  tileId,
  tileShortLabel,
  SUITS,
  SUIT_LABELS,
  type Suit,
  VALUES,
} from '../engine/tiles'
import { generateMidGameScenario, getVisibleTileCounts } from '../engine/game'
import Hand from '../components/Hand'
import DiscardPool from '../components/DiscardPool'
import TileComp from '../components/Tile'
import ResultBanner from '../components/ResultBanner'
import { useProgressStore } from '../store/progress'

type QuestionType = 'specific' | 'suit'

interface Question {
  type: QuestionType
  tile?: TileType
  suit?: Suit
  answer: number
}

function generateQuestion(
  game: ReturnType<typeof generateMidGameScenario>,
  playerIndex: number,
  difficulty: 'easy' | 'medium' | 'hard',
): Question {
  const visible = getVisibleTileCounts(game, playerIndex)

  if (difficulty === 'easy' || Math.random() < 0.5) {
    // Specific tile question
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)]
    const value = VALUES[Math.floor(Math.random() * VALUES.length)]
    const tile: TileType = { suit, value }
    const id = tileId(tile)
    const seen = visible[id] || 0
    return { type: 'specific', tile, answer: 4 - seen }
  } else {
    // Suit total question
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)]
    let totalSeen = 0
    for (let v = 1; v <= 9; v++) {
      totalSeen += visible[`${suit}${v}`] || 0
    }
    return { type: 'suit', suit, answer: 36 - totalSeen }
  }
}

export default function CardCountTrainerPage() {
  const [game, setGame] = useState(() => generateMidGameScenario(10))
  const [question, setQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [result, setResult] = useState<{ correct: boolean; answer: number } | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [startTime, setStartTime] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const addRecord = useProgressStore((s) => s.addRecord)

  const newQuestion = useCallback(() => {
    const q = generateQuestion(game, 0, difficulty)
    setQuestion(q)
    setUserAnswer('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [game, difficulty])

  const newRound = useCallback(() => {
    const g = generateMidGameScenario(
      difficulty === 'easy' ? 6 : difficulty === 'medium' ? 12 : 20,
    )
    setGame(g)
    setScore({ correct: 0, total: 0 })
    setStartTime(Date.now())
    setResult(null)
    setQuestion(null)
  }, [difficulty])

  useEffect(() => {
    newQuestion()
  }, [game])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question || result) {
      return
    }
    const ans = parseInt(userAnswer, 10)
    const correct = ans === question.answer
    setResult({ correct, answer: question.answer })
    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    }
    setScore(newScore)

    if (newScore.total % 10 === 0) {
      addRecord({
        date: new Date().toISOString().slice(0, 10),
        type: 'card-count',
        correct: newScore.correct,
        total: newScore.total,
        timeSpentMs: Date.now() - startTime,
      })
    }
  }

  const playerHand = game.players[0].hand

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">算牌训练</h1>
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); newRound() }}
              className={`px-3 py-1 rounded text-sm ${
                difficulty === d
                  ? 'bg-[#f4a261] text-black font-bold'
                  : 'bg-[#1a5c2e]/50 text-gray-300'
              }`}
            >
              {{ easy: '初级', medium: '中级', hard: '高级' }[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40 mb-4">
        <Hand tiles={playerHand} label="你的手牌" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {game.players.map((p, i) => (
          <DiscardPool
            key={i}
            tiles={p.discards}
            label={i === 0 ? '你的弃牌' : `玩家${i + 1}弃牌${p.missingSuit ? ` (缺${SUIT_LABELS[p.missingSuit]})` : ''}`}
          />
        ))}
      </div>

      {question && (
        <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40">
          <div className="text-lg mb-4">
            {question.type === 'specific' && question.tile ? (
              <span>
                <TileComp tile={question.tile} size="md" />
                <span className="ml-3">
                  {tileShortLabel(question.tile)} 还剩几张？
                </span>
              </span>
            ) : (
              <span>
                {SUIT_LABELS[question.suit!]}子 总共还剩几张没看到？
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3 items-center mb-4">
            <input
              ref={inputRef}
              type="number"
              min="0"
              max="36"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-20 px-3 py-2 rounded bg-[#0a1f12] border border-[#1a5c2e] text-white text-center text-lg"
              placeholder="?"
              disabled={!!result}
            />
            {!result ? (
              <button
                type="submit"
                className="px-4 py-2 bg-[#f4a261] text-black rounded font-bold hover:bg-[#e8964e]"
              >
                确认
              </button>
            ) : (
              <button
                type="button"
                onClick={newQuestion}
                className="px-4 py-2 bg-[#1a5c2e] text-white rounded font-bold hover:bg-[#2a7a4e]"
              >
                下一题
              </button>
            )}
          </form>

          {result && (
            <ResultBanner
              correct={result.correct}
              message={result.correct ? '正确！' : `错误，正确答案是 ${result.answer}`}
              detail={
                question.type === 'specific' && question.tile
                  ? `${tileShortLabel(question.tile)}: 总共4张，已看到${4 - result.answer}张，剩余${result.answer}张`
                  : `${SUIT_LABELS[question.suit!]}子: 总共36张，已看到${36 - result.answer}张，剩余${result.answer}张`
              }
            />
          )}

          <div className="mt-4 text-sm text-gray-400">
            本轮成绩：{score.correct}/{score.total}
            {score.total > 0 && ` (${Math.round((score.correct / score.total) * 100)}%)`}
            <button
              onClick={newRound}
              className="ml-4 text-[#f4a261] underline"
            >
              重新开局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
