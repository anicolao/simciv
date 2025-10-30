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

## Implementation Notes

### Canvas Sizing

The map canvas must dynamically size to fill its allocated space, resizing when the window resizes while maintaining proper aspect ratio of tiles and adjusting zoom level to show an appropriate map area.

### Control Panel Content

The control panel displays game information and the current map view.

---

## Navigation Flow

### Entry to Game View

When viewing a game, the application navigates to a full-page game view, replacing the lobby entirely (not overlaying it).

### Exit from Game View

Navigation back to the lobby returns the user to the lobby view, unloading the game view.

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
- Controls: Minimum usable size

### Minimum Viable Screen Size
- **Absolute minimum**: 480px × 640px (or 640px × 480px)
- Game is technically playable but suboptimal below this size

---

## Visual Design Mockups

### Landscape Mode Example (1920×1080)

Map extends to the left and top edges of the screen. Controls occupy right side.

```
┌─────────────────────────────────────────────────────┬──────────────────┐
│                                                     │                  │
│                                                     │                  │
│                                                     │                  │
│                                                     │                  │
│                    MAP CANVAS                       │    CONTROLS      │
│                    (1440 × 1080)                    │   (480 × 1080)   │
│                                                     │                  │
│                                                     │                  │
│                                                     │                  │
│                                                     │                  │
│                                                     │                  │
│                                                     │                  │
└─────────────────────────────────────────────────────┴──────────────────┘
```

**Dimensions:**
- Map: 75% of width (1440px), 100% of height (1080px)
- Controls: 25% of width (480px), 100% of height (1080px)

### Portrait Mode Example (768×1024)

Map extends to the left and top edges of the screen. Controls occupy bottom.

```
┌────────────────────────────────────┐
│                                    │
│                                    │
│                                    │
│                                    │
│           MAP CANVAS               │
│            (768 × 768)             │
│                                    │
│                                    │
│                                    │
│                                    │
├────────────────────────────────────┤
│                                    │
│           CONTROLS                 │
│          (768 × 256)               │
│                                    │
└────────────────────────────────────┘
```

**Dimensions:**
- Map: 100% of width (768px), 75% of height (768px)
- Controls: 100% of width (768px), 25% of height (256px)

### Square Mode Example (900×900)

Map extends to edges. Controls occupy bottom (since dimensions nearly equal).

```
┌────────────────────────────────────────┐
│                                        │
│                                        │
│                                        │
│           MAP CANVAS                   │
│            (900 × 594)                 │  ← 66% of height
│                                        │
│                                        │
├────────────────────────────────────────┤
│                                        │
│           CONTROLS                     │  ← 34% of height
│          (900 × 306)                   │
└────────────────────────────────────────┘
```

**Dimensions:**
- Map: 100% of width (900px), 66% of height (594px)
- Controls: 100% of width (900px), 34% of height (306px)

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
- Current game ID being viewed

---

## Implementation Strategy

1. Modify `GameLobby.svelte` to remove overlay dialog
2. Create new `GameView.svelte` component for full-page game
3. Implement landscape/portrait/square layout detection
4. Size canvas to fill allocated map area
5. Add window resize handling
6. Test on various screen sizes and orientations

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
- Enter game from lobby
- Exit game back to lobby

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



## Success Criteria

### Functional Requirements
- [ ] Full-page game view replaces overlay dialog
- [ ] Map uses minimum 50% of screen (66% in square mode)
- [ ] Layout adapts to landscape/portrait/square modes
- [ ] Controls positioned correctly based on orientation
- [ ] Canvas dynamically resizes to fill map area
- [ ] Navigation to/from lobby works correctly

---

## Design Alternatives Considered

### Alternative 1: Single Layout (No Orientation Awareness)

Use the same layout regardless of orientation. Rejected because it wastes space in portrait mode and is not mobile-friendly.

### Alternative 2: Fixed Map Percentage (Always 50/50)

Always split screen 50/50 between map and controls. Rejected because controls don't need that much space; a 70/30 split is more appropriate.

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

### API Layer
- No API changes required
- Same endpoints for game data, map tiles, etc.

### Authentication
- Navigation preserves authentication state
- Session remains valid across view transitions

---

## Conclusion

This gameplay UI redesign transforms the SimCiv experience from a cramped overlay dialog to an immersive full-page interface. By prioritizing map visibility and adapting intelligently to device orientation, the design ensures players can fully engage with the game world regardless of their device.

**Key Strengths:**

1. **Maximized Screen Usage**: Map extends to screen edges, no wasted space
2. **Responsive Design**: Adapts from phones to large monitors
3. **Orientation Awareness**: Layout automatically optimizes for device orientation
4. **Square Mode Handling**: Elegant solution for edge case of square windows
5. **Simple Navigation**: Clear path between lobby and game views

The 50% minimum map size guarantee (66% in square mode) ensures the game remains playable across all screen configurations, while the orientation-aware control panel positioning makes the interface feel intuitive on every device.

---

**Document Version History:**
- 0.0004 (2025-10-30): Initial design specification for gameplay UI

**Related Documents:**
- MAP_GENERATION.md: Map generation and terrain rendering
- MAP_INTERACTIONS.md: Map interaction and user controls
- 0.0002creategame.md: Game creation and lobby system
- version0.0001.md: Authentication and session management
