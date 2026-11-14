# Optional local 3D assets

Place user-owned or appropriately licensed GLTF/GLB assets in this directory and reference them from a scene with `assets.characterModelPath` or `assets.environmentModelPath`.

Example:

```json
{
  "assets": {
    "characterModelPath": "assets/models/presenter.glb"
  }
}
```

The renderer loads GLTF/GLB assets only when a path is present. Without an asset, it uses the low-poly procedural fallback so the VPS render remains GPU-optional.

Do not commit third-party models without checking their license. The repository does not ship a model by default.
