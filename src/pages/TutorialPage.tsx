import { useState } from 'react'
import { lessons, type Lesson } from '../tutorials/lessons'

function LessonCard({ lesson, onClick, active }: { lesson: Lesson; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        active ? 'bg-[#1a5c2e] border border-[#f4a261]/50' : 'bg-[#0d2818] border border-transparent hover:border-[#1a5c2e]'
      }`}
    >
      <div className="text-sm text-[#f4a261] font-mono">{lesson.id}</div>
      <div className="font-bold">{lesson.title}</div>
      <div className="text-gray-400 text-sm mt-1">{lesson.summary}</div>
    </button>
  )
}

export default function TutorialPage() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeLesson = lessons.find((l) => l.id === activeId)

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-6">系统教程</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-72 shrink-0 flex flex-col gap-2">
          {lessons.map((l) => (
            <LessonCard key={l.id} lesson={l} onClick={() => setActiveId(l.id)} active={activeId === l.id} />
          ))}
        </div>
        <div className="flex-1 bg-[#0d2818] rounded-xl p-6 border border-[#1a5c2e]/40 min-h-[400px]">
          {activeLesson ? (
            <div>
              <h2 className="text-xl font-bold text-[#f4a261] mb-1">{activeLesson.title}</h2>
              <div className="text-gray-400 text-sm mb-4">{activeLesson.summary}</div>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-gray-200 leading-relaxed">
                {activeLesson.content}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              选择左侧课程开始学习
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
