# GIT_WORKFLOW

## Team Rule (Mandatory)
Any new work must start from a feature branch based on `dev`.

## Official Branch Flow
1. Sync with `dev`:
```bash
git checkout dev
git pull origin dev
```
2. Create feature branch:
```bash
git checkout -b feature/<name>
```
3. After implementation:
```bash
git push origin feature/<name>
```
4. Open Pull Request:
- base branch must be `dev`
- target must not be `main`

## PR Policy
- PR to `dev` is required for all feature work.
- No direct commit to `main` for feature delivery.
- Keep PRs focused and reviewable.

## Commit Hygiene
- Use clear, scoped commit messages.
- Avoid mixing unrelated changes in one commit.
- Keep docs sync in same branch and PR as code change.

## Definition of Done (DoD)
Before marking a task done:
1. Feature implemented according to scope.
2. Relevant checks pass (`lint/build/test` as applicable).
3. Documentation synchronized (`docs/*` and process docs if needed).
4. PR opened against `dev`.
5. Review feedback addressed.

## Fast Checklist
- [ ] Branch started from `dev`
- [ ] Work done in `feature/<name>`
- [ ] Pushed to origin
- [ ] PR opened to `dev`
- [ ] Docs updated
- [ ] DoD satisfied
