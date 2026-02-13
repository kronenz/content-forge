---
globs: ["packages/**/*.ts"]
---
# Performance Rules
- Batch operations where possible (scoreMaterials, collectAllChannels)
- Use exponential backoff for retries (not linear)
- Set timeouts on all external API calls (30s default)
- Avoid synchronous blocking operations
- Stream large content instead of loading into memory
- Cache repeated lookups (channel specs, scoring criteria)
- Pipeline processing: process channels in parallel where independent
- Lock TTL: keep short (30s default), release promptly after work
