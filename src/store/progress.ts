import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TrainingRecord {
  date: string // YYYY-MM-DD
  type: 'card-count' | 'waiting' | 'discard' | 'daily'
  correct: number
  total: number
  timeSpentMs: number
}

export interface ProgressState {
  completedLessons: string[]
  records: TrainingRecord[]
  dailyStreak: number
  lastDailyDate: string | null
  xp: number

  completeLesson: (id: string) => void
  addRecord: (record: TrainingRecord) => void
  updateDailyStreak: (date: string) => void
  getAccuracy: (type: TrainingRecord['type']) => number
  getRecentRecords: (days: number) => TrainingRecord[]
  getWeakness: () => TrainingRecord['type'] | null
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: [],
      records: [],
      dailyStreak: 0,
      lastDailyDate: null,
      xp: 0,

      completeLesson: (id) =>
        set((s) => ({
          completedLessons: s.completedLessons.includes(id)
            ? s.completedLessons
            : [...s.completedLessons, id],
          xp: s.xp + 20,
        })),

      addRecord: (record) =>
        set((s) => ({
          records: [...s.records, record],
          xp: s.xp + record.correct * 10,
        })),

      updateDailyStreak: (date) =>
        set((s) => {
          const last = s.lastDailyDate
          if (last === date) {
            return {}
          }
          const yesterday = new Date(date)
          yesterday.setDate(yesterday.getDate() - 1)
          const yStr = yesterday.toISOString().slice(0, 10)
          const streak = last === yStr ? s.dailyStreak + 1 : 1
          return { dailyStreak: streak, lastDailyDate: date }
        }),

      getAccuracy: (type) => {
        const recs = get().records.filter((r) => r.type === type)
        if (recs.length === 0) {
          return 0
        }
        const total = recs.reduce((a, r) => a + r.total, 0)
        const correct = recs.reduce((a, r) => a + r.correct, 0)
        return total > 0 ? correct / total : 0
      },

      getRecentRecords: (days) => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        const cutoffStr = cutoff.toISOString().slice(0, 10)
        return get().records.filter((r) => r.date >= cutoffStr)
      },

      getWeakness: () => {
        const types: TrainingRecord['type'][] = ['card-count', 'waiting', 'discard']
        let worst: TrainingRecord['type'] | null = null
        let worstAcc = 1
        for (const type of types) {
          const acc = get().getAccuracy(type)
          const recs = get().records.filter((r) => r.type === type)
          if (recs.length >= 3 && acc < worstAcc) {
            worstAcc = acc
            worst = type
          }
        }
        return worst
      },
    }),
    { name: 'scmj-progress' },
  ),
)
