import type { Tile as TileType, Suit } from '../engine/tiles'
import { tileShortLabel } from '../engine/tiles'

const SUIT_COLORS: Record<Suit, string> = {
  wan: '#e63946',
  tiao: '#2a9d8f',
  tong: '#457b9d',
}

interface TileProps {
  tile: TileType
  selected?: boolean
  highlighted?: boolean
  dimmed?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  faceDown?: boolean
}

const SIZES = {
  sm: { w: 'w-7', h: 'h-10', text: 'text-xs' },
  md: { w: 'w-10', h: 'h-14', text: 'text-sm' },
  lg: { w: 'w-12', h: 'h-16', text: 'text-base' },
}

export default function Tile({
  tile,
  selected,
  highlighted,
  dimmed,
  onClick,
  size = 'md',
  faceDown,
}: TileProps) {
  const s = SIZES[size]
  const label = tileShortLabel(tile)
  const color = SUIT_COLORS[tile.suit]

  if (faceDown) {
    return (
      <div
        className={`${s.w} ${s.h} rounded-md bg-[#2d5a3d] border border-[#1a5c2e] shadow-md inline-flex items-center justify-center`}
      >
        <div className="w-3/4 h-3/4 rounded border border-[#3a7a50] bg-[#245232]" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`
        ${s.w} ${s.h} rounded-md border-2 shadow-md
        inline-flex flex-col items-center justify-center
        transition-all duration-150 select-none
        ${onClick ? 'cursor-pointer hover:translate-y-[-3px] active:translate-y-0' : 'cursor-default'}
        ${selected ? 'translate-y-[-6px] border-[#f4a261] ring-2 ring-[#f4a261]/40' : 'border-[#c8b88a]'}
        ${highlighted ? 'ring-2 ring-[#2ecc71]/60' : ''}
        ${dimmed ? 'opacity-40' : ''}
        bg-gradient-to-b from-[#faf5e8] to-[#e8dcc8]
      `}
    >
      <span className={`${s.text} font-bold leading-none`} style={{ color }}>
        {label[0]}
      </span>
      <span className={`${s.text} leading-none mt-0.5`} style={{ color }}>
        {label[1]}
      </span>
    </button>
  )
}
