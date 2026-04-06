import { Link } from 'react-router-dom'

const features = [
  { to: '/tutorial', title: '系统教程', desc: '从算牌基础到清一色理叫，5 大模块渐进式学习', icon: '📖' },
  { to: '/train/card-count', title: '算牌训练', desc: '模拟牌局，训练快速记牌和剩余牌计算', icon: '🔢' },
  { to: '/train/waiting', title: '理叫训练', desc: '分析听口，专项训练清一色复杂牌型', icon: '🎯' },
  { to: '/train/discard', title: '选打训练', desc: '综合攻防，判断最优弃牌方案', icon: '♟️' },
  { to: '/daily', title: '每日挑战', desc: '每天 20 分钟，难度自适应，持续进步', icon: '📅' },
  { to: '/dashboard', title: '数据面板', desc: '追踪进度，识别薄弱点，定向提升', icon: '📊' },
]

export default function HomePage() {
  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-[#f4a261]">川麻</span>训练
        </h1>
        <p className="text-gray-400 text-lg">血战到底 · 算牌理叫进阶工具</p>
        <p className="text-gray-500 mt-2 text-sm">换三张 · 缺一门 · 四番封顶</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <Link
            key={f.to}
            to={f.to}
            className="block p-5 rounded-xl bg-[#0d2818] border border-[#1a5c2e]/40 hover:border-[#f4a261]/60 transition-all hover:translate-y-[-2px]"
          >
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="text-lg font-bold text-[#f4a261] mb-1">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
