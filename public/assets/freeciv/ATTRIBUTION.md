# Freeciv Assets Attribution

## Overview

The assets in this directory are derived from the [Freeciv](https://www.freeciv.org/) project, an open-source turn-based strategy game.

## License

These assets are licensed under the **GNU General Public License v2** (GPL-2.0), which is compatible with SimCiv's GPL-3.0 license.

The original Freeciv source code and assets can be found at:
- Repository: https://github.com/freeciv/freeciv
- Website: https://www.freeciv.org/

## Copyright

Copyright (C) 1996-2024 The Freeciv Project

## Assets Included

### Trident Tileset
The Trident tileset is a classic overhead (non-isometric) tileset with 30x30 pixel tiles, suitable for simple 2D map rendering.

**Location**: `trident/`

**Artists**:
- Tatu Rissanen <tatu.rissanen@hut.fi>
- Jeff Mallatt <jjm@codewell.com> (miscellaneous)
- Eleazar (buoy)
- Vincent Croisier <vincent.croisier@advalvas.be> (ruins)
- Michael Johnson <justaguest> (nuke explosion)
- The Square Cow (inaccessible terrain)
- GriffonSpade
- Elefant (Nets)

**Files**:
- `tiles.png` + `tiles.spec` - Terrain tiles (grassland, ocean, mountains, forests, etc.)
- `units.png` + `units.spec` - Military and civilian unit sprites
- `cities.png` + `cities.spec` - City graphics for various sizes
- `roads.png` + `roads.spec` - Road network sprites
- `highways.png` + `highways.spec` - Advanced road infrastructure
- `fog.png` + `fog.spec` - Fog of war and darkness sprites
- `grid.png` + `grid.spec` - Tile grid overlay
- `select.png` + `select.spec` - Selection indicators
- `explosions.png` + `explosions.spec` - Combat effects
- `extra_units.png` + `extra_units.spec` - Additional unit sprites
- `earth.png` + `earth.spec` - Earth-specific tileset
- `auto_ll.spec` - Auto-loading layer specification
- `trident.tilespec` - Tileset configuration

### Misc Assets
Common UI elements and graphics used across tilesets.

**Location**: `misc/`

**Files**:
- `buildings.png` + `buildings.spec` - Wonder and building graphics
- `small.png` + `small.spec` - Small UI icons

## Usage in SimCiv

These assets are used to provide 2D map visualization for the SimCiv web client. The Trident tileset was chosen for its:
- Simple overhead view (easier web rendering than isometric)
- Compact tile size (30x30 pixels)
- Small file sizes (suitable for web delivery)
- Clear, classic Civilization aesthetic

## Modifications

Assets are used as-is from the Freeciv project. Any future modifications will be documented here.

## Complete Credits

For a complete list of Freeciv contributors, see:
https://www.freeciv.org/wiki/People

## License Text

```
GNU GENERAL PUBLIC LICENSE
Version 2, June 1991

Copyright (C) 1989, 1991 Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA

Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.
```

Full license text available at: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html

## Acknowledgment

SimCiv gratefully acknowledges the Freeciv project and its contributors for creating and maintaining these excellent game assets under an open-source license.
