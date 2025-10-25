<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getMapTiles, getStartingPosition, getMapMetadata } from '../utils/api';
  import { getTerrainSprite } from './terrainSprites';

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
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let tilesetImage: HTMLImageElement | null = null;
  let imageLoaded = false;
  
  const TILE_SIZE = 30; // FreeCiv Trident tiles are 30x30
  const BASE_DISPLAY_TILE_SIZE = 32; // Base display size at 1.0x zoom
  
  // Interaction state
  let zoomLevel = 1.0; // Current zoom multiplier (0.5 to 2.0)
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOffsetX = 0;
  let dragStartOffsetY = 0;
  let lastTouchDistance = 0; // For pinch zoom
  
  // Computed values based on zoom
  $: DISPLAY_TILE_SIZE = Math.round(BASE_DISPLAY_TILE_SIZE * zoomLevel);
  $: viewportTilesX = Math.floor(640 / DISPLAY_TILE_SIZE);
  $: viewportTilesY = Math.floor(480 / DISPLAY_TILE_SIZE);
  
  let wheelHandler: ((e: WheelEvent) => void) | null = null;
  let wheelListenerAdded = false;

  onMount(async () => {
    try {
      await loadTileset();
    } catch (err) {
      console.error('[MapView] Failed to load tileset in onMount:', err);
      // Continue anyway - will show error or fallback rendering
    }
    await loadMap();
  });
  
  // Add wheel event listener when canvas is available
  $: if (canvas && !wheelListenerAdded) {
    wheelHandler = (e: WheelEvent) => {
      handleWheel(e);
    };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    wheelListenerAdded = true;
    console.log('[MapView] Wheel event listener added');
  }
  
  onDestroy(() => {
    // Cleanup
    if (canvas && wheelHandler) {
      canvas.removeEventListener('wheel', wheelHandler);
      console.log('[MapView] Wheel event listener removed');
    }
  });

  async function loadTileset() {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        tilesetImage = img;
        imageLoaded = true;
        console.log('[MapView] Tileset loaded:', img.width, 'x', img.height);
        resolve();
      };
      img.onerror = (err) => {
        console.warn('[MapView] Failed to load tileset, will use colored squares fallback:', err);
        // Don't set error - we have a fallback
        reject(new Error('Failed to load tileset'));
      };
      img.src = '/assets/freeciv/trident/tiles.png';
      console.log('[MapView] Loading tileset from:', img.src);
    });
  }

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
      
      // Render the map once data is loaded
      renderMap();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load map';
      console.error('[MapView] Error loading map:', errorMsg, err);
      error = errorMsg;
      loading = false;
    }
  }

  function renderMap() {
    if (!canvas) {
      console.log('[MapView] Cannot render: canvas not ready');
      return;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[MapView] Failed to get canvas context');
      return;
    }

    // Enable pixelated rendering for crisp tiles
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render each tile
    for (let row = 0; row < viewportTilesY; row++) {
      for (let col = 0; col < viewportTilesX; col++) {
        const tileX = viewOffsetX + col;
        const tileY = viewOffsetY + row;
        const tile = getTileAt(tileX, tileY);

        if (tile) {
          renderTile(ctx, tile, col * DISPLAY_TILE_SIZE, row * DISPLAY_TILE_SIZE);
        }
      }
    }

    // Render starting city marker
    if (startingPosition) {
      const cityCol = startingPosition.startingCityX - viewOffsetX;
      const cityRow = startingPosition.startingCityY - viewOffsetY;
      
      if (cityCol >= 0 && cityCol < viewportTilesX && cityRow >= 0 && cityRow < viewportTilesY) {
        renderCityMarker(ctx, cityCol * DISPLAY_TILE_SIZE, cityRow * DISPLAY_TILE_SIZE);
      }
    }
  }

  function renderTile(ctx: CanvasRenderingContext2D, tile: MapTile, x: number, y: number) {
    const sprite = getTerrainSprite(tile.terrainType);
    
    if (sprite && tilesetImage && imageLoaded) {
      // Draw the terrain sprite from the tileset
      ctx.drawImage(
        tilesetImage,
        sprite.x, sprite.y, TILE_SIZE, TILE_SIZE,  // Source rectangle
        x, y, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE  // Destination rectangle
      );

      // Draw resource marker if present
      if (tile.resources.length > 0) {
        renderResourceMarker(ctx, tile.resources[0], x, y);
      }
    } else {
      // Fallback: draw a colored rectangle if tileset not loaded
      ctx.fillStyle = getTerrainColor(tile.terrainType);
      ctx.fillRect(x, y, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE);
      
      // Draw resource marker if present
      if (tile.resources.length > 0) {
        renderResourceMarker(ctx, tile.resources[0], x, y);
      }
    }
  }

  function renderResourceMarker(ctx: CanvasRenderingContext2D, resource: string, x: number, y: number) {
    // Draw a small circle with the first letter of the resource
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x + DISPLAY_TILE_SIZE - 8, y + 8, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(resource.charAt(0), x + DISPLAY_TILE_SIZE - 8, y + 8);
  }

  function renderCityMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Draw a star marker for the starting city
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw shadow
    ctx.fillStyle = '#000';
    ctx.fillText('⭐', x + DISPLAY_TILE_SIZE / 2 + 1, y + DISPLAY_TILE_SIZE / 2 + 1);
    
    // Draw star
    ctx.fillStyle = '#FFD700';
    ctx.fillText('⭐', x + DISPLAY_TILE_SIZE / 2, y + DISPLAY_TILE_SIZE / 2);
  }

  function getTileAt(x: number, y: number): MapTile | undefined {
    return tiles.find(t => t.x === x && t.y === y);
  }

  function getTerrainColor(terrainType: string): string {
    const colors: Record<string, string> = {
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
    return colors[terrainType] || '#9ca3af';
  }

  // Pan: Mouse event handlers
  function handleMouseDown(e: MouseEvent) {
    if (!canvas) return;
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;
    dragStartOffsetX = viewOffsetX;
    dragStartOffsetY = viewOffsetY;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - dragStartX;
    const deltaY = currentY - dragStartY;
    
    // Convert pixel delta to tile delta
    const tileDeltaX = deltaX / DISPLAY_TILE_SIZE;
    const tileDeltaY = deltaY / DISPLAY_TILE_SIZE;
    
    // Update view offset (negative because we're dragging the view, not the map)
    viewOffsetX = dragStartOffsetX - tileDeltaX;
    viewOffsetY = dragStartOffsetY - tileDeltaY;
    
    clampViewOffset();
    renderMap();
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleMouseLeave() {
    isDragging = false;
  }

  // Pan: Touch event handlers
  function handleTouchStart(e: TouchEvent) {
    if (!canvas) return;
    
    if (e.touches.length === 1) {
      // Single touch: pan
      e.preventDefault();
      isDragging = true;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      dragStartX = touch.clientX - rect.left;
      dragStartY = touch.clientY - rect.top;
      dragStartOffsetX = viewOffsetX;
      dragStartOffsetY = viewOffsetY;
    } else if (e.touches.length === 2) {
      // Two touches: prepare for pinch zoom
      e.preventDefault();
      isDragging = false;
      lastTouchDistance = getTouchDistance(e.touches[0], e.touches[1]);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (!canvas) return;
    
    if (e.touches.length === 1 && isDragging) {
      // Single touch: pan
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;
      
      const deltaX = currentX - dragStartX;
      const deltaY = currentY - dragStartY;
      
      const tileDeltaX = deltaX / DISPLAY_TILE_SIZE;
      const tileDeltaY = deltaY / DISPLAY_TILE_SIZE;
      
      viewOffsetX = dragStartOffsetX - tileDeltaX;
      viewOffsetY = dragStartOffsetY - tileDeltaY;
      
      clampViewOffset();
      renderMap();
    } else if (e.touches.length === 2) {
      // Two touches: pinch zoom
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const delta = currentDistance - lastTouchDistance;
      
      // Convert distance change to zoom delta (adjust sensitivity)
      const zoomDelta = delta / 200;
      updateZoomLevel(zoomDelta);
      
      lastTouchDistance = currentDistance;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      isDragging = false;
      lastTouchDistance = 0;
    }
  }

  // Zoom: Wheel event handler
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    
    // Determine zoom direction (negative deltaY = zoom in)
    // deltaY is typically ~100 per scroll tick
    const zoomDelta = -e.deltaY / 100;
    updateZoomLevel(zoomDelta);
  }

  // Utility: Get distance between two touch points
  function getTouchDistance(t1: Touch, t2: Touch): number {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Utility: Update zoom level
  function updateZoomLevel(delta: number) {
    console.log('[MapView] updateZoomLevel called with delta:', delta);
    const oldZoom = zoomLevel;
    
    // Discrete zoom levels: 0.5, 0.75, 1.0, 1.5, 2.0
    const zoomLevels = [0.5, 0.75, 1.0, 1.5, 2.0];
    const currentIndex = zoomLevels.findIndex(z => Math.abs(z - zoomLevel) < 0.01);
    console.log('[MapView] Current zoom index:', currentIndex, 'zoom:', zoomLevel);
    
    let newIndex = currentIndex;
    // Use a much lower threshold for trackpad scrolling (0.01 instead of 0.5)
    if (delta > 0.01) {
      // Zoom in
      newIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
      console.log('[MapView] Zooming in, newIndex:', newIndex);
    } else if (delta < -0.01) {
      // Zoom out
      newIndex = Math.max(currentIndex - 1, 0);
      console.log('[MapView] Zooming out, newIndex:', newIndex);
    }
    
    if (newIndex !== currentIndex) {
      zoomLevel = zoomLevels[newIndex];
      console.log('[MapView] Zoom level changed to:', zoomLevel);
      clampViewOffset();
      renderMap();
    } else {
      console.log('[MapView] Zoom level not changed');
    }
  }

  // Utility: Clamp view offset to map bounds
  function clampViewOffset() {
    if (!metadata) return;
    
    const maxOffsetX = Math.max(0, metadata.width - viewportTilesX);
    const maxOffsetY = Math.max(0, metadata.height - viewportTilesY);
    
    viewOffsetX = Math.max(0, Math.min(viewOffsetX, maxOffsetX));
    viewOffsetY = Math.max(0, Math.min(viewOffsetY, maxOffsetY));
  }

  // Re-render when canvas is mounted, tiles are loaded, or view changes
  $: if (canvas && tiles.length > 0) {
    renderMap();
  }
  
  // Re-render when zoom level changes
  $: if (canvas && tiles.length > 0 && zoomLevel) {
    renderMap();
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
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
        {/if}
      </div>
      
      <div class="canvas-container">
        <canvas
          bind:this={canvas}
          width={640}
          height={480}
          class="map-canvas"
          class:dragging={isDragging}
          on:mousedown={handleMouseDown}
          on:mousemove={handleMouseMove}
          on:mouseup={handleMouseUp}
          on:mouseleave={handleMouseLeave}
          on:touchstart={handleTouchStart}
          on:touchmove={handleTouchMove}
          on:touchend={handleTouchEnd}
        ></canvas>
      </div>

      <div class="legend">
        <h4>Terrain Legend</h4>
        <div class="legend-text">
          Map rendered using FreeCiv Trident tileset (30x30 pixel sprites)<br>
          Drag to pan • Scroll to zoom • Pinch to zoom (touch)
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

  .canvas-container {
    display: flex;
    justify-content: center;
    border: 2px solid #999;
    background: #000;
  }

  .map-canvas {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .map-canvas.dragging {
    cursor: grabbing;
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

  .legend-text {
    color: #666;
    font-size: 14px;
  }
</style>
