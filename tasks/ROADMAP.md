# Execution Roadmap

Only one phase may be active at a time.

## 00 — Baseline

Status: **ACTIVE**

Task: `tasks/00-baseline.md`

Gate: deterministic smoke tests and screenshots without geometry changes.

## 01 — Shared parameter kernel

Status: BLOCKED BY 00

Extract a validated Tiger I candidate specification while preserving the existing public builder API. Add camera configuration as a separate schema. Prove the web app and headless harness use the same geometry implementation.

## 02 — Silhouette evaluator

Status: BLOCKED BY 01

Add fixed-camera mask capture, target masks, overlays, IoU, boundary distance/F1, landmark error, geometry checks, and evidence manifests. Reference and evaluator paths become protected after human calibration.

## 03 — Bounded optimizer

Status: BLOCKED BY 02

Add deterministic mixed-variable search, elites, mutation/crossover, Pareto selection, seed replay, stagnation detection, and budget termination.

## 04 — Codex/Cursor revision loop

Status: BLOCKED BY 03

Add isolated worktree creation, a Codex builder adapter, Cursor read-only review adapter, task JSON schema, protected-file hashing, target/holdout verification, accept/rollback logic, and run-state persistence.

## 05 — QoderWork MCP

Status: BLOCKED BY 04

Expose the deterministic orchestrator through a local Windows-compatible MCP server. QoderWork controls runs but does not edit production code.

## 06 — Web product integration

Status: BLOCKED BY 05

Add reference upload, candidate gallery, score breakdown, overlay comparison, generation history, and winner export without coupling UI state to evaluator internals.
