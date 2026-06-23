---
name: versioning
description: N.E.X.U.S. version numbering convention and location
metadata:
  type: project
---

The project version is displayed in [src/components/cyber/HudBar.tsx](src/components/cyber/HudBar.tsx) line 36 as `N.E.X.U.S. vX.Y.ZZ`.

**Version bump rules:**
- **Normal update**: increment the minor version by 0.01. E.g., v0.4.5 → v0.4.6 → v0.4.7 (not v0.4.51).
- **Major milestone**: increment the second number. E.g., v0.4.x → v0.5.0 when all Demacia events are complete.
- Format: `v{major}.{minor}.{patch}` where patch is two digits padded.

Current version: **v0.4.5**.
