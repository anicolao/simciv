<script lang="ts">
  import { onMount } from 'svelte';
  import { getMapTiles, getStartingPosition, getMapMetadata } from '../utils/api';

  export let gameId: string;

  interface MapTile {
    gameId: string;
    x: number;
    y: number;
    elevation: number;
    terrainType: string;
    climateZone: string;
    hasRiver: boolean;
    isCoastal: boolean;
    resources: string[];
  }

  interface StartingPosition {
    centerX: number;
    centerY: number;
    startingCityX: number;
    startingCityY: number;
  }

  interface MapMetadata {
    width: number;
    height: number;
    seaLevel: number;
  }

  let tiles: MapTile[] = [];
  let startingPosition: StartingPosition | null = null;
  let metadata: MapMetadata | null = null;
  let loading = true;
  let error = '';
  let viewOffsetX = 0;
  let viewOffsetY = 0;
  const tileSize = 32; // pixels
  const viewportTilesX = 20;
  const viewportTilesY = 15;

  // Terrain type to color mapping
  const terrainColors: Record<string, string> = {
    'OCEAN': '#1e40af',
    'SHALLOW_WATER': '#3b82f6',
    'MOUNTAIN': '#78716c',
    'HILLS': '#a8a29e',
    'GRASSLAND': '#22c55e',
    'PLAINS': '#84cc16',
    'FOREST': '#166534',
    'JUNGLE': '#14532d',
    'DESERT': '#eab308',
    'TUNDRA': '#e5e7eb',
    'ICE': '#f3f4f6'
  };

  onMount(async () => {
    await loadMap();
  });

  async function loadMap() {
    loading = true;
    error = '';
    try {
      // Load map data
      const [tilesResponse, positionResponse, metadataResponse] = await Promise.all([
        getMapTiles(gameId),
        getStartingPosition(gameId),
        getMapMetadata(gameId)
      ]);

      tiles = tilesResponse.tiles;
      startingPosition = positionResponse.position;
      metadata = metadataResponse.metadata;

      // Debug logging
      console.log('[MapView] Loaded map data:', {
        tileCount: tiles.length,
        firstTile: tiles[0],
        terrainTypes: [...new Set(tiles.map(t => t.terrainType))].join(', '),
        startingPosition,
        metadata
      });

      // Center view on starting position
      if (startingPosition) {
        viewOffsetX = startingPosition.centerX - Math.floor(viewportTilesX / 2);
        viewOffsetY = startingPosition.centerY - Math.floor(viewportTilesY / 2);
        console.log('[MapView] View centered at:', { viewOffsetX, viewOffsetY });
      }

      loading = false;
    } catch (err: any) {
      error = err.message || 'Failed to load map';
      loading = false;
    }
  }

  function getTileAt(x: number, y: number): MapTile | undefined {
    return tiles.find(t => t.x === x && t.y === y);
  }

  function getTerrainColor(terrainType: string): string {
    return terrainColors[terrainType] || '#9ca3af';
  }

  function getResourceIcon(resources: string[]): string {
    if (resources.length === 0) return '';
    // Show first letter of first resource
    return resources[0].charAt(0);
  }
</script>

<div class="map-view">
  {#if loading}
    <div class="loading">Loading map...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="map-container">
      <div class="map-header">
        <h3>Game Map</h3>
        {#if metadata}
          <span class="map-info">
            Map Size: {metadata.width}x{metadata.height} | 
            Visible Tiles: {tiles.length}
          </span>
        {/if}
      </div>
      
      <div class="map-grid">
        {#each Array(viewportTilesY) as _, row}
          <div class="map-row">
            {#each Array(viewportTilesX) as _, col}
              {@const tileX = viewOffsetX + col}
              {@const tileY = viewOffsetY + row}
              {@const tile = getTileAt(tileX, tileY)}
              <div 
                class="map-tile"
                class:hidden={!tile}
                class:coastal={tile?.isCoastal}
                class:river={tile?.hasRiver}
                style="background-color: {tile ? getTerrainColor(tile.terrainType) : '#000'}"
                title={tile ? `${tile.terrainType} (${tileX},${tileY})` : 'Hidden'}
              >
                {#if tile && tile.resources.length > 0}
                  <span class="resource-marker">{getResourceIcon(tile.resources)}</span>
                {/if}
                {#if startingPosition && tileX === startingPosition.startingCityX && tileY === startingPosition.startingCityY}
                  <span class="city-marker">⭐</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <div class="legend">
        <h4>Legend</h4>
        <div class="legend-items">
          {#each Object.entries(terrainColors) as [terrain, color]}
            <div class="legend-item">
              <div class="legend-color" style="background-color: {color}"></div>
              <span>{terrain}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .map-view {
    padding: 20px;
  }

  .loading, .error {
    text-align: center;
    padding: 40px;
    font-size: 18px;
  }

  .error {
    color: #c62828;
    background: #ffebee;
    border-radius: 4px;
  }

  .map-container {
    max-width: 100%;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
  }

  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .map-header h3 {
    margin: 0;
    color: #333;
  }

  .map-info {
    color: #666;
    font-size: 14px;
  }

  .map-grid {
    display: flex;
    flex-direction: column;
    border: 1px solid #999;
    width: fit-content;
    margin: 0 auto;
  }

  .map-row {
    display: flex;
  }

  .map-tile {
    width: 32px;
    height: 32px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
    text-shadow: 0 0 2px black;
  }

  .map-tile.hidden {
    background-color: #000 !important;
  }

  .map-tile.coastal {
    border: 1px solid #60a5fa;
  }

  .map-tile.river {
    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  .resource-marker {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 8px;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.8);
    color: #000;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .city-marker {
    font-size: 16px;
    filter: drop-shadow(0 0 2px black);
  }

  .legend {
    margin-top: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .legend h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #555;
  }

  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
  }

  .legend-color {
    width: 20px;
    height: 20px;
    border: 1px solid #999;
  }
</style>
