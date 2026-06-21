---
name: versioning
description: N.E.X.U.S. version numbering convention and location
metadata:
  type: project
---

The project version is displayed in [src/components/cyber/HudBar.tsx](src/components/cyber/HudBar.tsx) line 36 as `N.E.X.U.S. vX.Y.Z`.

**Version bump rules:**
- **Small update** (minor fix/tweak): increment the third number by 0.01. E.g., v0.2.1 → v0.2.11 (meaning v0.2.1 → v0.2.2 → … treat each 0.01 as a step).
- **Major update** (significant new feature or rewrite): increment the second number and reset third to 0.1. E.g., v0.2.x → v0.3.1.

Current version as of the last update: **v0.2.1**.
