import { useProgressStore, type TrainingRecord } from '../store/progress'

const TYPE_LABELS: Record<TrainingRecord['type'], string> = {
  'card-count': '算牌',
  waiting: '理叫',
  discard: '选打',
  daily: '每日挑战',
}

function AccuracyBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm text-gray-400">{label}</span>
      <div className="flex-1 h-4 rounded-full bg-[#0a1f12] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 80 ? '#2ecc71' : pct >= 50 ? '#f4a261' : '#e74c3c',
          }}
        />
      </div>
      <span className="w-12 text-right text-sm font-mono">
        {value > 0 ? `${pct}%` : '—'}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const {
    completedLessons,
    records,
    dailyStreak,
    xp,
    getAccuracy,
    getRecentRecords,
    getWeakness,
  } = useProgressStore()

  const level = Math.floor(xp / 100) + 1
  const xpInLevel = xp % 100
  const recentRecords = getRecentRecords(7)
  const weakness = getWeakness()

  const totalPractice = records.length
  const totalCorrect = records.reduce((a, r) => a + r.correct, 0)
  const totalQuestions = records.reduce((a, r) => a + r.total, 0)
  const totalTimeMin = Math.round(
    records.reduce((a, r) => a + r.timeSpentMs, 0) / 60000,
  )

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-6">数据面板</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="等级" value={`Lv.${level}`} sub={`${xpInLevel}/100 XP`} />
        <StatCard label="连续打卡" value={`${dailyStreak}天`} sub="每日挑战" />
        <StatCard
          label="总正确率"
          value={totalQuestions > 0 ? `${Math.round((totalCorrect / totalQuestions) * 100)}%` : '—'}
          sub={`${totalCorrect}/${totalQuestions}`}
        />
        <StatCard label="练习次数" value={`${totalPractice}`} sub={`用时${totalTimeMin}分钟`} />
      </div>

      <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40 mb-4">
        <h2 className="text-lg font-bold mb-4">各模块正确率</h2>
        <div className="space-y-3">
          <AccuracyBar label="算牌" value={getAccuracy('card-count')} />
          <AccuracyBar label="理叫" value={getAccuracy('waiting')} />
          <AccuracyBar label="选打" value={getAccuracy('discard')} />
          <AccuracyBar label="每日" value={getAccuracy('daily')} />
        </div>
      </div>

      {weakness && (
        <div className="bg-[#1a0a0a] rounded-xl p-4 border border-[#e74c3c]/30 mb-4">
          <div className="text-[#e74c3c] font-bold mb-1">薄弱点提示</div>
          <div className="text-gray-300 text-sm">
            你的 <span className="text-[#f4a261] font-bold">{TYPE_LABELS[weakness]}</span> 正确率较低，
            建议多练习该模块，或重温相关教程。
          </div>
        </div>
      )}

      <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40 mb-4">
        <h2 className="text-lg font-bold mb-4">最近 7 天记录</h2>
        {recentRecords.length === 0 ? (
          <div className="text-gray-500 text-sm">暂无记录，开始训练吧！</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {[...recentRecords].reverse().map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded bg-[#0a1f12] text-sm"
              >
                <span className="text-gray-500 w-20">{r.date}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  r.type === 'card-count' ? 'bg-[#e63946]/20 text-[#e63946]' :
                  r.type === 'waiting' ? 'bg-[#2a9d8f]/20 text-[#2a9d8f]' :
                  r.type === 'discard' ? 'bg-[#457b9d]/20 text-[#457b9d]' :
                  'bg-[#f4a261]/20 text-[#f4a261]'
                }`}>
                  {TYPE_LABELS[r.type]}
                </span>
                <span className="flex-1">
                  {r.correct}/{r.total}
                  ({Math.round((r.correct / Math.max(r.total, 1)) * 100)}%)
                </span>
                {r.timeSpentMs > 0 && (
                  <span className="text-gray-500">
                    {Math.round(r.timeSpentMs / 60000)}分钟
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#0d2818] rounded-xl p-5 border border-[#1a5c2e]/40">
        <h2 className="text-lg font-bold mb-3">已完成教程</h2>
        {completedLessons.length === 0 ? (
          <div className="text-gray-500 text-sm">还没有完成任何教程</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {completedLessons.map((id) => (
              <span key={id} className="px-2 py-1 rounded bg-[#1a5c2e]/30 text-[#2ecc71] text-sm">
                {id}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-[#0d2818] rounded-xl p-4 border border-[#1a5c2e]/40 text-center">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="text-xl font-bold text-[#f4a261]">{value}</div>
      <div className="text-gray-500 text-xs mt-0.5">{sub}</div>
    </div>
  )
}
