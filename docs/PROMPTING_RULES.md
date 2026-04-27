# PROMPTING_RULES

## Purpose
Short, strict rules to keep AI output consistent and useful.

## Core Rules
1. State scope, constraints, and expected output before asking for implementation.
2. Reference exact file paths for any requested change.
3. Request minimal scoped edits and avoid unrelated refactors.
4. Require evidence-based reasoning; no assumptions without code reference.
5. Require validation summary in the final output.

## Required Output Format
Every AI response should end with:
- `Scope covered`
- `Files touched`
- `Validation run`
- `Docs synced`

## Quick Prompt Template
```text
Task: <what to do>
Scope: <allowed files/areas>
Constraints: <what must not change>
Output: <exact format expected>
Validation: <checks to run/report>
```
