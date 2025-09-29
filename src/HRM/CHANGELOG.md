# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added (Initial Release)

- Parameter reference table in README.
- Planned environment variable override section (not yet active code-level overrides).
- Changelog file scaffold.

### Upcoming

- Environment variable default overrides (HRM_CONFIDENCE_THRESHOLD, HRM_CONVERGENCE_THRESHOLD, HRM_MAX_AUTO_STEPS).
- Plateau-focused integration test for `auto_reason`.

## [0.1.0] - 2025-09-28

### Added

- Initial hierarchical reasoning operations: `h_plan`, `l_execute`, `h_update`, `evaluate`, `halt_check`, `auto_reason`.
- Session TTL with eviction mechanism.
- Structured auto-reasoning trace array & `halt_trigger` metadata (`confidence_convergence`, `plateau`, `max_steps`).
- Duplicate low-level thought suppression guard.
- Internal Zod-to-JSON-schema generator for tool input schema.
- Initial Vitest test suite (TTL eviction, halt triggers, duplicate guard).

