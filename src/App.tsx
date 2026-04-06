import { Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TutorialPage from './pages/TutorialPage'
import CardCountTrainerPage from './pages/CardCountTrainerPage'
import WaitingTrainerPage from './pages/WaitingTrainerPage'
import DiscardTrainerPage from './pages/DiscardTrainerPage'
import DailyChallengePage from './pages/DailyChallengePage'
import DashboardPage from './pages/DashboardPage'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/tutorial', label: '教程' },
  { to: '/train/card-count', label: '算牌' },
  { to: '/train/waiting', label: '理叫' },
  { to: '/train/discard', label: '选打' },
  { to: '/daily', label: '每日挑战' },
  { to: '/dashboard', label: '数据' },
]

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-[#0d2818] border-b border-[#1a5c2e]/50 px-2 sm:px-4 py-2 flex gap-0.5 sm:gap-1 overflow-x-auto shrink-0 scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#1a5c2e] text-[#f4a261] font-bold'
                  : 'text-gray-300 hover:bg-[#1a5c2e]/50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-2 sm:p-4 max-w-5xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/train/card-count" element={<CardCountTrainerPage />} />
          <Route path="/train/waiting" element={<WaitingTrainerPage />} />
          <Route path="/train/discard" element={<DiscardTrainerPage />} />
          <Route path="/daily" element={<DailyChallengePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  )
}
