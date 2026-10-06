# Repository Guidelines & AI Assistant Rules

## Automatic Git Push on Changes
- **Rule**: Whenever any changes (files created, edited, deleted, or assets added) are made to this project, the AI assistant **MUST automatically stage, commit, and push** the changes to the `main` branch on GitHub (`origin main`).
- **Commands**:
  ```bash
  git add -A
  git commit -m "<concise descriptive message in conventional commit format>"
  git push origin main
  ```
- **Remote**: `https://github.com/Ginero-168/3DR.git`
- **Branch**: `main`
- **Goal**: Ensure that `3dr.kirita.me` and GitHub always stay up to date in real time after every user request.
