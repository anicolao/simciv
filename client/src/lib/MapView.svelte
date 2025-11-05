<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getMapTiles, getStartingPosition, getMapMetadata, getUnits, getSettlements } from '../utils/api';
  import { getTerrainSprite } from './terrainSprites';
  import { getUnitSprite, getCitySprite } from './unitSprites';
  import type { Unit, Settlement } from '../utils/api';

  export let gameId: string;
  export let fillContainer = false; // If true, canvas fills its container

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
  let units: Unit[] = [];
  let settlements: Settlement[] = [];
  let loading = true;
  let error = '';
  let pollInterval: number | null = null;
  let viewOffsetX = 0; // Pixel offset, not tile offset
  let viewOffsetY = 0; // Pixel offset, not tile offset
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let tilesetImage: HTMLImageElement | null = null;
  let unitsImage: HTMLImageElement | null = null;
  let citiesImage: HTMLImageElement | null = null;
  let imageLoaded = false;
  let unitsImageLoaded = false;
  let citiesImageLoaded = false;
  
  const TILE_SIZE = 30; // FreeCiv Trident tiles are 30x30
  const BASE_DISPLAY_TILE_SIZE = 32; // Base display size at 1.0x zoom
  
  // Canvas size (default or dynamic)
  let canvasWidth = 640;
  let canvasHeight = 480;
  let containerElement: HTMLDivElement;
  
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
  $: viewportTilesX = Math.floor(canvasWidth / DISPLAY_TILE_SIZE);
  $: viewportTilesY = Math.floor(canvasHeight / DISPLAY_TILE_SIZE);
  
  let wheelHandler: ((e: WheelEvent) => void) | null = null;
  let wheelListenerAdded = false;

  function updateCanvasSize() {
    if (fillContainer && containerElement) {
      const rect = containerElement.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);
      
      // Only update if dimensions actually changed
      if (newWidth !== canvasWidth || newHeight !== canvasHeight) {
        canvasWidth = newWidth;
        canvasHeight = newHeight;
        console.log('[MapView] Canvas resized to container:', canvasWidth, 'x', canvasHeight);
        
        // Re-render after a short delay to ensure canvas is updated
        if (tiles.length > 0) {
          setTimeout(() => {
            if (canvas) {
              renderMap();
            }
          }, 100);
        }
      }
    }
  }

  onMount(async () => {
    try {
      await Promise.all([loadTileset(), loadUnitsImage(), loadCitiesImage()]);
    } catch (err) {
      console.error('[MapView] Failed to load sprites in onMount:', err);
      // Continue anyway - will show error or fallback rendering
    }
    
    // Update canvas size if filling container
    if (fillContainer) {
      updateCanvasSize();
      window.addEventListener('resize', updateCanvasSize);
    }
    
    await loadMap();

    // Poll for units and settlements updates every second
    pollInterval = window.setInterval(async () => {
      await loadUnitsAndSettlements();
    }, 1000);
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
    if (pollInterval !== null) {
      clearInterval(pollInterval);
    }
    if (fillContainer) {
      window.removeEventListener('resize', updateCanvasSize);
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

  async function loadUnitsImage() {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        unitsImage = img;
        unitsImageLoaded = true;
        console.log('[MapView] Units image loaded:', img.width, 'x', img.height);
        resolve();
      };
      img.onerror = (err) => {
        console.warn('[MapView] Failed to load units image:', err);
        reject(new Error('Failed to load units image'));
      };
      img.src = '/assets/freeciv/trident/units.png';
    });
  }

  async function loadCitiesImage() {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        citiesImage = img;
        citiesImageLoaded = true;
        console.log('[MapView] Cities image loaded:', img.width, 'x', img.height);
        resolve();
      };
      img.onerror = (err) => {
        console.warn('[MapView] Failed to load cities image:', err);
        reject(new Error('Failed to load cities image'));
      };
      img.src = '/assets/freeciv/trident/cities.png';
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

      // Center view on starting position (now in pixels)
      if (startingPosition) {
        viewOffsetX = (startingPosition.centerX - Math.floor(viewportTilesX / 2)) * DISPLAY_TILE_SIZE;
        viewOffsetY = (startingPosition.centerY - Math.floor(viewportTilesY / 2)) * DISPLAY_TILE_SIZE;
        console.log('[MapView] View centered at:', { viewOffsetX, viewOffsetY });
      }

      // Load initial units and settlements
      await loadUnitsAndSettlements();

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

  async function loadUnitsAndSettlements() {
    try {
      const [unitsResponse, settlementsResponse] = await Promise.all([
        getUnits(gameId),
        getSettlements(gameId)
      ]);

      units = unitsResponse.units;
      settlements = settlementsResponse.settlements;

      // Trigger re-render if canvas is ready
      if (canvas && tiles.length > 0) {
        renderMap();
      }
    } catch (err: any) {
      console.error('[MapView] Error loading units and settlements:', err);
      // Don't set error state for polling failures
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

    // Calculate which tiles are visible (convert pixel offset to tile coordinates)
    const startTileX = Math.floor(viewOffsetX / DISPLAY_TILE_SIZE);
    const startTileY = Math.floor(viewOffsetY / DISPLAY_TILE_SIZE);
    
    // Calculate pixel offset within the first tile
    // Use proper modulo that works with negative numbers
    const pixelOffsetX = ((viewOffsetX % DISPLAY_TILE_SIZE) + DISPLAY_TILE_SIZE) % DISPLAY_TILE_SIZE;
    const pixelOffsetY = ((viewOffsetY % DISPLAY_TILE_SIZE) + DISPLAY_TILE_SIZE) % DISPLAY_TILE_SIZE;

    // Render tiles with sub-pixel positioning for smooth scrolling
    // Need to render one extra tile in each direction to fill the canvas
    for (let row = 0; row <= viewportTilesY + 1; row++) {
      for (let col = 0; col <= viewportTilesX + 1; col++) {
        const tileX = startTileX + col;
        const tileY = startTileY + row;
        const tile = getTileAt(tileX, tileY);

        if (tile) {
          // Position tiles with sub-pixel accuracy
          const screenX = col * DISPLAY_TILE_SIZE - pixelOffsetX;
          const screenY = row * DISPLAY_TILE_SIZE - pixelOffsetY;
          renderTile(ctx, tile, screenX, screenY);
        }
      }
    }

    // Render units
    for (const unit of units) {
      const unitScreenX = (unit.location.x - startTileX) * DISPLAY_TILE_SIZE - pixelOffsetX;
      const unitScreenY = (unit.location.y - startTileY) * DISPLAY_TILE_SIZE - pixelOffsetY;
      
      // Only render if visible on screen
      if (unitScreenX >= -DISPLAY_TILE_SIZE && unitScreenX < canvas.width &&
          unitScreenY >= -DISPLAY_TILE_SIZE && unitScreenY < canvas.height) {
        renderUnit(ctx, unit, unitScreenX, unitScreenY);
      }
    }

    // Render settlements
    for (const settlement of settlements) {
      const settlementScreenX = (settlement.location.x - startTileX) * DISPLAY_TILE_SIZE - pixelOffsetX;
      const settlementScreenY = (settlement.location.y - startTileY) * DISPLAY_TILE_SIZE - pixelOffsetY;
      
      // Only render if visible on screen
      if (settlementScreenX >= -DISPLAY_TILE_SIZE && settlementScreenX < canvas.width &&
          settlementScreenY >= -DISPLAY_TILE_SIZE && settlementScreenY < canvas.height) {
        renderSettlement(ctx, settlement, settlementScreenX, settlementScreenY);
      }
    }

    // Render starting city marker (for reference - will be replaced by actual settlement)
    if (startingPosition && settlements.length === 0) {
      const cityScreenX = (startingPosition.startingCityX - startTileX) * DISPLAY_TILE_SIZE - pixelOffsetX;
      const cityScreenY = (startingPosition.startingCityY - startTileY) * DISPLAY_TILE_SIZE - pixelOffsetY;
      
      // Only render if visible on screen
      if (cityScreenX >= -DISPLAY_TILE_SIZE && cityScreenX < canvas.width &&
          cityScreenY >= -DISPLAY_TILE_SIZE && cityScreenY < canvas.height) {
        renderCityMarker(ctx, cityScreenX, cityScreenY);
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

  function renderUnit(ctx: CanvasRenderingContext2D, unit: Unit, x: number, y: number) {
    const sprite = getUnitSprite(unit.unitType);
    
    if (sprite && unitsImage && unitsImageLoaded) {
      // Draw the unit sprite from the units tileset
      ctx.drawImage(
        unitsImage,
        sprite.x, sprite.y, TILE_SIZE, TILE_SIZE,  // Source rectangle
        x, y, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE  // Destination rectangle
      );
    } else {
      // Fallback: draw a colored square
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(x + 2, y + 2, DISPLAY_TILE_SIZE - 4, DISPLAY_TILE_SIZE - 4);
    }
  }

  function renderSettlement(ctx: CanvasRenderingContext2D, settlement: Settlement, x: number, y: number) {
    const sprite = getCitySprite(settlement.type);
    
    if (sprite && citiesImage && citiesImageLoaded) {
      // Draw the settlement sprite from the cities tileset
      ctx.drawImage(
        citiesImage,
        sprite.x, sprite.y, TILE_SIZE, TILE_SIZE,  // Source rectangle
        x, y, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE  // Destination rectangle
      );
      
      // Draw settlement name if zoom is sufficient
      if (zoomLevel >= 1.0) {
        const nameFontSize = Math.max(10, Math.round(DISPLAY_TILE_SIZE * 0.4));
        ctx.font = `${nameFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(settlement.name, x + DISPLAY_TILE_SIZE / 2, y + DISPLAY_TILE_SIZE + 8);
        ctx.fillText(settlement.name, x + DISPLAY_TILE_SIZE / 2, y + DISPLAY_TILE_SIZE + 8);
      }
    } else {
      // Fallback: draw a colored circle
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x + DISPLAY_TILE_SIZE / 2, y + DISPLAY_TILE_SIZE / 2, DISPLAY_TILE_SIZE / 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  function renderCityMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Draw a star marker for the starting city (grayed out)
    const fontSize = Math.max(20, Math.round(DISPLAY_TILE_SIZE * 0.8));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw shadow
    ctx.fillStyle = '#000';
    ctx.fillText('⭐', x + DISPLAY_TILE_SIZE / 2 + 1, y + DISPLAY_TILE_SIZE / 2 + 1);
    
    // Draw star (grayed out to indicate it's a placeholder)
    ctx.fillStyle = '#999';
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
    
    // Update view offset directly in pixels (1:1 movement)
    viewOffsetX = dragStartOffsetX - deltaX;
    viewOffsetY = dragStartOffsetY - deltaY;
    
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
      
      // Update view offset directly in pixels (1:1 movement)
      viewOffsetX = dragStartOffsetX - deltaX;
      viewOffsetY = dragStartOffsetY - deltaY;
      
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
    
    // More granular zoom levels for smoother experience (50% to 200% in 10% increments)
    const zoomLevels = [
      0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0
    ];
    const currentIndex = zoomLevels.findIndex(z => Math.abs(z - zoomLevel) < 0.01);
    console.log('[MapView] Current zoom index:', currentIndex, 'zoom:', zoomLevel);
    
    let newIndex = currentIndex;
    // Increased threshold to make zoom less sensitive (0.05 instead of 0.01)
    if (delta > 0.05) {
      // Zoom in
      newIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
      console.log('[MapView] Zooming in, newIndex:', newIndex);
    } else if (delta < -0.05) {
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
    
    // Allow panning as long as at least one tile is visible
    // Maximum offset is when the last tile is at the top-left corner of viewport
    const maxOffsetX = metadata.width * DISPLAY_TILE_SIZE - DISPLAY_TILE_SIZE;
    const maxOffsetY = metadata.height * DISPLAY_TILE_SIZE - DISPLAY_TILE_SIZE;
    
    // Minimum offset is when the first tile is at the bottom-right corner of viewport
    const minOffsetX = -(canvasWidth - DISPLAY_TILE_SIZE);
    const minOffsetY = -(canvasHeight - DISPLAY_TILE_SIZE);
    
    viewOffsetX = Math.max(minOffsetX, Math.min(viewOffsetX, maxOffsetX));
    viewOffsetY = Math.max(minOffsetY, Math.min(viewOffsetY, maxOffsetY));
  }

  // Re-render when canvas is mounted, tiles are loaded, or view changes
  $: if (canvas && tiles.length > 0) {
    renderMap();
  }
  
  // Re-render when zoom level changes
  $: if (canvas && tiles.length > 0 && zoomLevel) {
    renderMap();
  }
  
  // Re-render when canvas size changes
  $: if (canvas && tiles.length > 0 && (canvasWidth || canvasHeight)) {
    renderMap();
  }
</script>

<div class="map-view" class:fill-container={fillContainer} bind:this={containerElement}>
  {#if loading}
    <div class="loading">Loading map...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="map-container" class:full-size={fillContainer}>
      {#if !fillContainer}
        <div class="map-header">
          <h3>Game Map</h3>
          {#if metadata}
            <span class="map-info">
              Map Size: {metadata.width}x{metadata.height} | 
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
          {/if}
        </div>
      {/if}
      
      <div class="canvas-container" class:full-size={fillContainer}>
        <canvas
          bind:this={canvas}
          width={canvasWidth}
          height={canvasHeight}
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

      {#if !fillContainer}
        <div class="legend">
          <h4>Terrain Legend</h4>
          <div class="legend-text">
            Map rendered using FreeCiv Trident tileset (30x30 pixel sprites)<br>
            Drag to pan • Scroll to zoom • Pinch to zoom (touch)
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .map-view {
    padding: 20px;
  }

  .map-view.fill-container {
    padding: 0;
    width: 100%;
    height: 100%;
    position: relative;
  }

  .loading, .error {
    text-align: center;
    padding: 40px;
    font-size: 18px;
  }

  .map-view.fill-container .loading,
  .map-view.fill-container .error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
  }

  .error {
    color: #c62828;
    background: #ffebee;
    border-radius: 4px;
  }

  .map-view.fill-container .error {
    background: rgba(255, 235, 238, 0.1);
  }

  .map-container {
    max-width: 100%;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
  }

  .map-container.full-size {
    max-width: none;
    width: 100%;
    height: 100%;
    background: #000;
    border: none;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
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

  .canvas-container.full-size {
    flex: 1;
    border: none;
    justify-content: stretch;
    align-items: stretch;
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

  .full-size .map-canvas {
    width: 100%;
    height: 100%;
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
