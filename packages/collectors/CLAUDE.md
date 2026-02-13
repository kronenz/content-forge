# Collectors Module Rules

## Purpose
8 material collectors for gathering source content.

## Rules
- Each collector implements a common collector interface
- Must handle rate limiting and caching
- Graceful degradation on source unavailability
- All collected data normalized to core types
