# SimCiv Gameplay UI Design Specification
## Full-Page Game View with Responsive Layout

### Document Status
**Version:** 0.0004  
**Status:** Design Review  
**Last Updated:** 2025-10-30  
**Purpose:** Specification for improved gameplay user interface with full-page game view and responsive map/controls layout

---

## Executive Summary

This document specifies a redesigned gameplay user interface for SimCiv that replaces the current pop-up dialog approach with a full-page game view. The new design maximizes screen real estate utilization while providing an intuitive, responsive layout that adapts to different device orientations and screen sizes.

**Key Features:**
- Full-page game view (no overlay dialogs)
- Responsive layout adapts to portrait and landscape orientations
- Map consumes majority of screen space (minimum 50%)
- Dedicated control panel positioned based on device orientation
- Graceful handling of square/near-square aspect ratios
- Seamless navigation between lobby and game views

This design enhances the player experience by providing an immersive, distraction-free game interface while maintaining easy access to game controls and information.

---

## Current State Analysis

### Existing Implementation

Currently, when a player views a game, the interface:

1. **Opens as Overlay Dialog**: Game details and map appear in a fixed-position modal overlay
2. **Limited Screen Usage**: Constrained to `max-width: 90vw, max-height: 90vh`
3. **Static Canvas Size**: Map canvas fixed at 640x480 pixels
4. **No Responsive Layout**: Same layout regardless of device orientation
5. **Overlay Context**: Game view appears over the lobby, requiring close button to return

**Problems with Current Approach:**
- Wastes valuable screen real estate
- Map is too small on larger displays
- UI feels cramped and not immersive
- Difficult to see map details on mobile devices
- No adaptation to landscape vs portrait modes
- Overlay metaphor doesn't match the importance of game view

---

## Design Goals

### Primary Objectives

1. **Maximize Map Visibility**: Map should use as much screen space as possible while leaving room for controls
2. **Responsive Layout**: Adapt to different screen sizes and orientations automatically
3. **Intuitive Controls**: Controls should be positioned logically based on device orientation
4. **Immersive Experience**: Full-page view eliminates distractions and focuses on gameplay
5. **Easy Navigation**: Clear path between lobby and game view

### Layout Principles

1. **Map First**: Map is the primary focus and gets priority for screen space
2. **Minimum 50% Rule**: Map must never be less than 50% of total screen area
3. **Orientation Awareness**: Layout changes based on portrait vs landscape
4. **Square Window Handling**: Special rules for nearly-square aspect ratios
5. **Touch-Friendly**: Controls sized appropriately for touch devices

---

## Responsive Layout Specification

### Layout Modes

The interface has two primary layout modes based on device orientation:

#### 1. Landscape Mode (Width > Height)

**Control Panel Position**: Right side of screen  
**Map Position**: Left side, consuming remaining space

```
┌──────────────────────────────────┬──────────┐
│                                  │          │
│                                  │          │
│              MAP                 │ CONTROLS │
│                                  │          │
│                                  │          │
└──────────────────────────────────┴──────────┘
```

**Layout Rules:**
- Controls occupy a fixed-width vertical panel on the right
- Map fills all remaining space on the left
- Control panel width: minimum 280px, maximum 400px (20-30% of viewport width)
- Map gets 70-80% of viewport width

#### 2. Portrait Mode (Height > Width)

**Control Panel Position**: Bottom of screen  
**Map Position**: Top, consuming remaining space

```
┌───────────────────┐
│                   │
│                   │
│        MAP        │
│                   │
│                   │
├───────────────────┤
│     CONTROLS      │
└───────────────────┘
```

**Layout Rules:**
- Controls occupy a fixed-height horizontal panel at the bottom
- Map fills all remaining space at the top
- Control panel height: minimum 200px, maximum 350px (20-30% of viewport height)
- Map gets 70-80% of viewport height

#### 3. Square/Near-Square Mode (Aspect Ratio ≈ 1:1)

**Detection**: When `0.8 < (width / height) < 1.2`

**Layout Strategy**: Use the longer dimension to give map more space

```
Example: 800x850 window (portrait-ish)
┌───────────────────┐
│                   │
│                   │
│                   │
│        MAP        │  ← Gets 66% of height (562px)
│                   │
│                   │
├───────────────────┤
│     CONTROLS      │  ← Gets 34% of height (288px)
└───────────────────┘
```

**Square Mode Rules:**
- Determine which dimension is longer (even if slightly)
- Map gets 66% of the longer dimension
- Controls get 34% of the longer dimension
- If dimensions are exactly equal, default to landscape mode (controls on right)
- This ensures map gets more than 50% while controls remain usable

### Minimum Map Size Guarantee

The map must always be at least 50% of the screen area, **except** in square mode where it gets 66% of the longer dimension:

**Standard Modes:**
- Landscape: Map ≥ 70% of width, 100% of height → typically 70%+ of area
- Portrait: Map ≥ 70% of height, 100% of width → typically 70%+ of area

**Square Mode:**
- Map = 66% of longer dimension × 100% of shorter dimension
- Example: 800×800 window → map = 528×800 = 52.8% of area ✓

---

## Implementation Details

### Layout Detection and Switching

```typescript
// Pseudo-code for layout mode detection
function determineLayoutMode() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;
  
  if (aspectRatio < 0.8) {
    // Portrait mode: height significantly greater than width
    return 'portrait';
  } else if (aspectRatio > 1.2) {
    // Landscape mode: width significantly greater than height
    return 'landscape';
  } else {
    // Square mode: approximately equal dimensions
    return 'square';
  }
}

function calculateLayout(mode: string) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  switch (mode) {
    case 'landscape':
      return {
        mapWidth: width * 0.75,      // 75% of width
        mapHeight: height,            // 100% of height
        controlWidth: width * 0.25,   // 25% of width
        controlHeight: height,        // 100% of height
        controlPosition: 'right'
      };
      
    case 'portrait':
      return {
        mapWidth: width,              // 100% of width
        mapHeight: height * 0.75,     // 75% of height
        controlWidth: width,          // 100% of width
        controlHeight: height * 0.25, // 25% of height
        controlPosition: 'bottom'
      };
      
    case 'square':
      // Use longer dimension to give map 66%
      if (height >= width) {
        // Portrait-ish square
        return {
          mapWidth: width,
          mapHeight: height * 0.66,
          controlWidth: width,
          controlHeight: height * 0.34,
          controlPosition: 'bottom'
        };
      } else {
        // Landscape-ish square
        return {
          mapWidth: width * 0.66,
          mapHeight: height,
          controlWidth: width * 0.34,
          controlHeight: height,
          controlPosition: 'right'
        };
      }
  }
}
```

### Canvas Sizing

The map canvas must dynamically size to fill its allocated space:

```typescript
// Canvas should be sized to map area
canvas.width = mapWidth;
canvas.height = mapHeight;

// Adjust tile size to fit viewport
const tilesVisibleX = Math.floor(mapWidth / BASE_TILE_SIZE);
const tilesVisibleY = Math.floor(mapHeight / BASE_TILE_SIZE);

// Or scale tiles to show more of the map
const scaleFactor = calculateOptimalScale(mapWidth, mapHeight, totalMapTiles);
```

**Considerations:**
- Canvas should resize when window resizes
- Maintain aspect ratio of tiles
- Adjust zoom level to show appropriate map area
- Redraw map when canvas size changes

### Control Panel Content

The control panel should contain:

1. **Game Information Header**
   - Game ID
   - Current year
   - Player name
   - Current civilization

2. **Quick Stats**
   - Population
   - Resources
   - Science progress
   - Military strength

3. **Action Buttons**
   - End turn (or current turn status in real-time)
   - City management
   - Unit commands
   - Diplomacy
   - Technology tree
   - Settings

4. **Navigation**
   - Return to lobby button
   - Help/tutorial
   - Game menu

**Layout Adaptation:**
- In landscape mode (vertical panel): Stack items vertically
- In portrait mode (horizontal panel): Use columns or scrollable horizontal layout
- In square mode: Adapt based on chosen orientation

---

## Navigation Flow

### Entry to Game View

**From Lobby:**
1. Player clicks "View" button on a game card
2. Application navigates to full-page game view
3. URL updates to reflect game (e.g., `/game/{gameId}`)
4. Game view loads map and controls
5. Lobby is completely replaced (not overlaid)

**Implementation Options:**
- **Option A (Single-Page)**: Hide lobby component, show game component
- **Option B (Routing)**: Use Svelte routing to change pages
- **Option C (URL-based)**: Navigate to `/game/{gameId}` path

### Exit from Game View

**Return to Lobby:**
1. Player clicks "Back to Lobby" or "Leave Game" button
2. Application navigates back to lobby
3. URL updates to reflect lobby view
4. Game view unloads, lobby reloads

**Browser Back Button:**
- Should return to lobby from game view
- Requires proper routing/history management

---

## Responsive Breakpoints

### Desktop/Large Tablets
- **Width ≥ 1024px**: Full layout with generous spacing
- Map minimum: 720px wide (landscape) or 720px tall (portrait)
- Controls: 280-400px wide (landscape) or 250-350px tall (portrait)

### Tablets
- **Width 768px - 1023px**: Comfortable layout
- Map minimum: 520px wide (landscape) or 520px tall (portrait)
- Controls: 240-280px wide (landscape) or 200-250px tall (portrait)

### Mobile Phones
- **Width < 768px**: Compact layout
- Map minimum: 100% of width (landscape) or 65% of height (portrait)
- Controls: Minimum usable size, possibly scrollable
- Consider collapsible control panel on mobile

### Minimum Viable Screen Size
- **Absolute minimum**: 480px × 640px (or 640px × 480px)
- Below this, show warning message suggesting larger screen
- Game is technically playable but suboptimal

---

## Visual Design Mockups

### Landscape Mode Example (1920×1080)

```
┌─────────────────────────────────────────────────────┬──────────────────┐
│ Game #abc123        Year: 4850 BC        Player: Alice  │ Back to Lobby   │
├─────────────────────────────────────────────────────┤                  │
│                                                     │ GAME STATS       │
│                                                     │ ──────────────── │
│                                                     │ Population: 125  │
│                                                     │ Food: 45/100     │
│                    MAP CANVAS                       │ Production: 12   │
│                    (1440 × 1020)                    │ Science: 8       │
│                                                     │                  │
│             [Pan and zoom enabled]                  │ QUICK ACTIONS    │
│                                                     │ ──────────────── │
│        ⭐ = Your starting city                      │ [City Mgmt]      │
│                                                     │ [Units]          │
│                                                     │ [Tech Tree]      │
│                                                     │ [Diplomacy]      │
│                                                     │                  │
│                                                     │ MINI MAP         │
│                                                     │ ┌──────────────┐ │
│                                                     │ │   [*]        │ │
│                                                     │ │              │ │
│                                                     │ └──────────────┘ │
└─────────────────────────────────────────────────────┴──────────────────┘
```

### Portrait Mode Example (768×1024)

```
┌────────────────────────────────────┐
│ Game #abc123      Year: 4850 BC    │
│ Player: Alice         [< Lobby]    │
├────────────────────────────────────┤
│                                    │
│                                    │
│                                    │
│           MAP CANVAS               │
│            (768 × 718)             │
│                                    │
│      [Pan and zoom enabled]        │
│                                    │
│         ⭐ = Your city              │
│                                    │
├────────────────────────────────────┤
│ Pop: 125 │ Food: 45 │ Prod: 12    │
│──────────────────────────────────  │
│ [Cities] [Units] [Tech] [Diplo]   │
│                                    │
│ [Mini Map]  [Game Menu] [Help]    │
└────────────────────────────────────┘
```

### Square Mode Example (900×900)

```
┌────────────────────────────────────────┐
│ Game #abc123         Year: 4850 BC     │
│ Player: Alice            [< Lobby]     │
├────────────────────────────────────────┤
│                                        │
│                                        │
│                                        │
│           MAP CANVAS                   │
│            (900 × 594)                 │  ← 66% of height
│                                        │
│      [Pan and zoom enabled]            │
│                                        │
├────────────────────────────────────────┤
│ Population: 125    Food: 45/100       │  ← 34% of height
│ Production: 12     Science: 8         │
│────────────────────────────────────────│
│ [Cities] [Units] [Tech] [Diplomacy]   │
│ [Mini Map]       [Menu]       [Help]  │
└────────────────────────────────────────┘
```

---

## Database and State Management

### No Schema Changes Required

The full-page game view is purely a frontend change. No modifications to:
- Game data structures
- Map tile storage
- Player information
- Session management

### Client State Requirements

The client must track:
- Current layout mode (landscape/portrait/square)
- Window dimensions
- Canvas size
- Control panel visibility state (for mobile collapse feature)
- Current game ID being viewed

---

## Implementation Strategy

### Phase 1: Basic Full-Page Layout
1. Modify `GameLobby.svelte` to remove overlay dialog
2. Create new `GameView.svelte` component for full-page game
3. Implement basic landscape/portrait detection
4. Add "Back to Lobby" navigation
5. Size canvas to fill allocated map area

### Phase 2: Responsive Layout
1. Implement three layout modes (landscape/portrait/square)
2. Add window resize handling
3. Create responsive control panel layouts
4. Test on various screen sizes and orientations

### Phase 3: Enhanced Controls
1. Design control panel UI
2. Populate with game information and actions
3. Add mini-map visualization
4. Implement collapsible controls (mobile)

### Phase 4: Polish
1. Smooth transitions between layouts
2. Loading states and error handling
3. Accessibility improvements
4. Performance optimization (canvas rendering)

---

## User Experience Considerations

### Transitions
- Smooth transition when entering/exiting game view
- No jarring layout shifts when rotating device
- Loading indicator while game data loads

### Orientation Changes
- Detect orientation change immediately
- Recalculate layout and redraw
- Preserve map zoom and pan position

### Touch and Mouse Support
- Map pan: Click/touch and drag
- Map zoom: Mouse wheel or pinch gesture
- Control interactions: Click or tap
- Ensure controls are touch-friendly (minimum 44×44px touch targets)

### Accessibility
- Keyboard navigation support
- Screen reader announcements for game state changes
- High contrast mode support
- Configurable text sizes

---

## Testing Requirements

### Layout Mode Testing
- Test landscape mode on desktop (1920×1080, 1440×900, etc.)
- Test portrait mode on mobile (375×667, 414×896, etc.)
- Test square mode (800×800, 900×900, 1024×1024)
- Test edge cases (479×640, 641×640, etc.)

### Responsive Behavior
- Window resize while viewing game
- Device rotation (portrait ↔ landscape)
- Browser zoom in/out
- Mobile browser with/without address bar

### Navigation
- Enter game from lobby (various games)
- Exit game back to lobby
- Browser back/forward buttons
- Direct URL access (e.g., `/game/abc123`)

### Performance
- Canvas rendering performance with large maps
- Layout recalculation speed on resize
- Memory usage with long gaming sessions
- Multiple orientation changes

### Cross-Browser
- Chrome/Edge (Blink engine)
- Firefox (Gecko)
- Safari (WebKit)
- Mobile browsers (Chrome, Safari, Samsung Internet)

---

## Future Enhancements

### Not in Version 0.0004

**Advanced UI Features:**
- Picture-in-picture mini lobby (view other games while playing)
- Split-screen multiplayer (two players on same screen)
- Detachable control panel (drag to reposition)
- Customizable control panel layout
- Multiple map view modes (strategic, tactical, economic)

**Mobile-Specific Features:**
- Gesture shortcuts for common actions
- Haptic feedback for important events
- Mobile-optimized touch controls
- Offline mode with sync

**Accessibility:**
- Voice commands
- Screen reader full support
- Colorblind-friendly palettes
- Dyslexia-friendly fonts
- One-handed mode

**Performance:**
- WebGL-based map rendering
- Progressive map loading
- Level-of-detail (LOD) for tiles
- Background tile caching

---

## Success Criteria

### Functional Requirements
- [ ] Full-page game view replaces overlay dialog
- [ ] Map uses minimum 50% of screen (66% in square mode)
- [ ] Layout adapts to landscape/portrait/square modes
- [ ] Controls positioned correctly based on orientation
- [ ] Canvas dynamically resizes to fill map area
- [ ] Navigation to/from lobby works correctly
- [ ] Browser back button returns to lobby

### Non-Functional Requirements
- [ ] Layout recalculation completes in < 100ms on orientation change
- [ ] Canvas renders smoothly (60fps) during pan/zoom
- [ ] Responsive breakpoints work on all target devices
- [ ] Touch interactions feel native on mobile
- [ ] No layout jank or visual glitches

### User Experience
- [ ] Interface feels immersive and focused
- [ ] Controls are intuitive and easy to access
- [ ] Map is clear and easy to navigate
- [ ] Transitions are smooth and professional
- [ ] Works well on phones, tablets, and desktops

---

## Design Alternatives Considered

### Alternative 1: Floating Control Panel

**Description:** Controls in a draggable, resizable floating panel over the map.

**Rejected Because:**
- Obscures map content
- Adds complexity for mobile users
- Not as clean as dedicated layout sections
- Can be added later as optional enhancement

### Alternative 2: Single Layout (No Orientation Awareness)

**Description:** Use the same layout (e.g., controls on right) regardless of orientation.

**Rejected Because:**
- Wastes space in portrait mode
- Not mobile-friendly
- Doesn't meet responsive design goals
- Less intuitive on different devices

### Alternative 3: Tabs for Map vs Controls

**Description:** Switch between map view and controls view with tabs.

**Rejected Because:**
- Violates goal of seeing map and controls simultaneously
- Poor UX for real-time gameplay
- Requires constant tab switching
- Reduces situational awareness

### Alternative 4: Fixed Map Percentage (Always 50/50)

**Description:** Always split screen 50/50 between map and controls.

**Rejected Because:**
- Controls don't need that much space
- Wastes screen real estate
- Doesn't maximize map visibility
- 70/30 split is more appropriate

---

## Integration with Existing Systems

### Map Rendering (`MapView.svelte`)
- Update canvas size based on allocated map area
- Adjust tile rendering to scale appropriately
- Maintain pan and zoom functionality
- Preserve FreeCiv tileset rendering

### Game Lobby (`GameLobby.svelte`)
- Remove overlay dialog approach
- Add navigation to full-page game view
- Ensure proper state cleanup when navigating away
- Maintain polling for game updates while in lobby

### API Layer (`utils/api.ts`)
- No API changes required
- Same endpoints for game data, map tiles, etc.
- May add endpoint for game state updates in real-time

### Authentication
- Ensure navigation preserves authentication state
- Session remains valid across view transitions
- Game access control unchanged

---

## Conclusion

This gameplay UI redesign transforms the SimCiv experience from a cramped overlay dialog to an immersive full-page interface. By prioritizing map visibility and adapting intelligently to device orientation, the design ensures players can fully engage with the game world regardless of their device.

**Key Strengths:**

1. **Maximized Screen Usage**: Every pixel serves a purpose, no wasted space
2. **Responsive Design**: Seamlessly adapts from phones to large monitors
3. **Orientation Awareness**: Layout automatically optimizes for device orientation
4. **Square Mode Handling**: Elegant solution for edge case of square windows
5. **Simple Navigation**: Clear path between lobby and game views
6. **Future-Proof**: Foundation for advanced features and enhancements

The 50% minimum map size guarantee (66% in square mode) ensures the game remains playable and enjoyable across all screen configurations, while the orientation-aware control panel positioning makes the interface feel native and intuitive on every device.

This specification provides clear implementation guidance while remaining flexible enough to accommodate future enhancements and platform-specific optimizations. The design maintains consistency with SimCiv's database-centric architecture and existing client-side technologies.

---

**Document Version History:**
- 0.0004 (2025-10-30): Initial design specification for gameplay UI

**Related Documents:**
- MAP_GENERATION.md: Map generation and terrain rendering
- MAP_INTERACTIONS.md: Map interaction and user controls
- 0.0002creategame.md: Game creation and lobby system
- version0.0001.md: Authentication and session management
