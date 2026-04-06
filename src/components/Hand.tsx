import type { Tile as TileType } from '../engine/tiles'
import { tileId } from '../engine/tiles'
import Tile from './Tile'

interface HandProps {
  tiles: TileType[]
  selectedTileId?: string | null
  highlightedTileIds?: Set<string>
  onTileClick?: (tile: TileType, index: number) => void
  size?: 'sm' | 'md' | 'lg'
  label?: string
  drawnTile?: TileType | null
}

export default function Hand({
  tiles,
  selectedTileId,
  highlightedTileIds,
  onTileClick,
  size = 'md',
  label,
  drawnTile,
}: HandProps) {
  return (
    <div>
      {label && (
        <div className="text-sm text-gray-400 mb-1.5">{label}</div>
      )}
      <div className="flex flex-wrap gap-0.5 items-end">
        {tiles.map((tile, i) => (
          <Tile
            key={`${tileId(tile)}-${i}`}
            tile={tile}
            selected={selectedTileId === `${tileId(tile)}-${i}`}
            highlighted={highlightedTileIds?.has(tileId(tile))}
            onClick={onTileClick ? () => onTileClick(tile, i) : undefined}
            size={size}
          />
        ))}
        {drawnTile && (
          <>
            <div className="w-2" />
            <Tile
              tile={drawnTile}
              onClick={onTileClick ? () => onTileClick(drawnTile, tiles.length) : undefined}
              size={size}
              highlighted
            />
          </>
        )}
      </div>
    </div>
  )
}
