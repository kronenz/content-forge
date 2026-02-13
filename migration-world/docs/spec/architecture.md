# Architecture Spec

## End-to-End Flow
collectors -> intake store -> routing -> transform/quality gates -> delivery adapters -> analytics -> feedback

## Boundaries
- core is the central shared contract
- all business modules import from core
- queue/lock abstraction supports local/prod swap
- domain policy and entity naming come from `config/domain.json`
