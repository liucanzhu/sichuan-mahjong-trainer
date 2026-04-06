import type { Tile as TileType } from '../engine/tiles'
import { tileId } from '../engine/tiles'
import Tile from './Tile'

interface DiscardPoolProps {
  tiles: TileType[]
  label?: string
  highlightedTileIds?: Set<string>
}

export default function DiscardPool({ tiles, label, highlightedTileIds }: DiscardPoolProps) {
  return (
    <div>
      {label && <div className="text-sm text-gray-400 mb-1.5">{label}</div>}
      <div className="flex flex-wrap gap-0.5 p-3 rounded-lg bg-[#0a1f12] border border-[#1a5c2e]/30 min-h-[48px]">
        {tiles.length === 0 && (
          <span className="text-gray-600 text-sm">暂无弃牌</span>
        )}
        {tiles.map((tile, i) => (
          <Tile
            key={`discard-${tileId(tile)}-${i}`}
            tile={tile}
            size="sm"
            highlighted={highlightedTileIds?.has(tileId(tile))}
          />
        ))}
      </div>
    </div>
  )
}
