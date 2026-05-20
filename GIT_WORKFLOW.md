# Git Workflow

This project is ready to use with a branch-based workflow.

1. Initialize Git if this folder is not already a repository:
   ```bash
   git init
   git checkout -b develop
   ```

2. Create feature branches from `develop`:
   ```bash
   git checkout -b feature/movie-search-ui
   ```

3. Keep `main` production-only. Merge completed work into `develop`, test with `npm run lint` and `npm run build`, then promote stable releases into `main`.

4. Do not commit real `.env` secrets. Commit `.env.example` only, and set `VITE_OMDB_API_KEY` locally or in the deployment provider.
