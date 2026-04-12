# Testing Guide: PR Code Review Action

## Step 1: Create the GitHub Repository

```bash
cd testing_repo
git init
git add -A
# IMPORTANT: remove .env from staging (it's in .gitignore but was force-added)
git reset HEAD .env
git commit -m "Initial commit: multi-language test project"
```

Create a new repo on GitHub (e.g. `your-org/pr-review-testing`), then:

```bash
git remote add origin https://github.com/your-org/pr-review-testing.git
git push -u origin main
```

## Step 2: Configure Secrets

Go to **Settings > Secrets and variables > Actions** in your GitHub repo and add:

| Secret | Value |
|--------|-------|
| `OPENAI_API_KEY` | Your OpenAI API key from [platform.openai.com](https://platform.openai.com) |

> `GITHUB_TOKEN` is automatically provided by GitHub Actions — no setup needed.

## Step 3: Set Token Permissions

Go to **Settings > Actions > General > Workflow permissions** and select:

- **Read and write permissions**
- Check **Allow GitHub Actions to create and approve pull requests**

## Step 4: Update Workflow to Point to Your Action

Edit `.github/workflows/pr-review.yaml` and change the action reference to match where you published the action:

```yaml
# Change this:
- uses: agogear/chatgpt-pr-review@v2

# To your fork/repo, e.g.:
- uses: your-org/chatgpt-pr-review@main
```

## Step 5: Create Test PRs

Each test PR should target specific tools. Create branches and PRs like this:

### Test 1: Python (Semgrep + Ruff + Bandit + detect-secrets)

```bash
git checkout -b test/python
# Files already exist — just create the PR
git push -u origin test/python
# Open PR on GitHub: test/python -> main
```

**Expected findings:**
- SQL injection in `app.py` (Semgrep)
- `pickle.loads` usage (Bandit B301)
- `eval()` usage (Bandit B307)
- MD5 hashing (Bandit B303)
- Shell injection via `subprocess` (Bandit B602)
- Insecure random (Bandit B311)
- Hardcoded AWS keys, Slack token, GitHub token (detect-secrets)
- Unused variables, `== None`, `range(len(...))` (Ruff)

### Test 2: JavaScript/TypeScript (Semgrep + ESLint + npm audit)

```bash
git checkout main
git checkout -b test/javascript
git push -u origin test/javascript
```

**Expected findings:**
- XSS via `res.send(query)` (Semgrep)
- `eval()` usage (ESLint no-eval)
- Path traversal (Semgrep)
- Hardcoded credentials (detect-secrets)
- `var` usage (ESLint no-var)
- `==` instead of `===` (ESLint eqeqeq)
- `console.log` in production (ESLint no-console)
- Vulnerable dependencies in `package.json` (npm audit: lodash, minimist, axios, etc.)

### Test 3: Java (Semgrep + PMD + Checkstyle)

```bash
git checkout main
git checkout -b test/java
git push -u origin test/java
```

**Expected findings:**
- SQL injection (Semgrep)
- MD5 hashing (Semgrep)
- SSRF (Semgrep)
- God method complexity (PMD)
- Empty catch block (PMD)
- Unused method parameters (PMD)
- Formatting: spaces around `=`, method parameter alignment (Checkstyle)

### Test 4: Go (Semgrep + golangci-lint)

```bash
git checkout main
git checkout -b test/go
git push -u origin test/go
```

**Expected findings:**
- SQL injection (Semgrep)
- Command injection (Semgrep/gosec)
- MD5 usage (gosec)
- Unchecked errors in `writeFile` (golangci-lint: errcheck)
- Deprecated `ioutil` usage (golangci-lint: staticcheck)
- Unused parameter (golangci-lint: unparam)

### Test 5: Shell (ShellCheck)

```bash
git checkout main
git checkout -b test/shell
git push -u origin test/shell
```

**Expected findings:**
- Unquoted variables SC2086
- Backtick usage SC2006
- Word splitting SC2046
- Iterating over `ls` output SC2045
- `read` without `-r` SC2162
- `cd` without `|| exit` SC2164
- Unquoted array expansion SC2068

### Test 6: Docker + IaC (Hadolint + Checkov)

```bash
git checkout main
git checkout -b test/infra
git push -u origin test/infra
```

**Expected findings:**
- Untagged base image DL3006 (Hadolint)
- Unpinned apt packages DL3008 (Hadolint)
- `ADD` instead of `COPY` DL3020 (Hadolint)
- Non-JSON `CMD` DL3025 (Hadolint)
- Pipe without `pipefail` DL4006 (Hadolint)
- Public S3 bucket (Checkov)
- Unencrypted RDS (Checkov)
- Unrestricted security group (Checkov)
- Hardcoded DB password in Terraform (Checkov)

### Test 7: Full Review (All tools + scoring)

```bash
git checkout main
git checkout -b test/full-review
# Modify a few files to create a realistic PR
echo "# New feature" >> README.md
git add -A
git commit -m "Add all test files"
git push -u origin test/full-review
```

This triggers auto-detection of all languages and runs every applicable tool.

## Step 6: Verify Results

After each PR is created, the action runs automatically. Check:

1. **Actions tab** — confirm the workflow ran successfully
2. **PR conversation** — look for the "Automated Code Review" comment
3. **Review content** should include:
   - Static analysis findings (grouped by file)
   - LLM review explaining findings and adding design/logic insights
   - PR quality observations
   - Test coverage warnings
   - Educational scoring (if enabled)

## Tool Coverage Matrix

| File | Semgrep | Ruff | Bandit | ESLint | npm audit | PMD | Checkstyle | golangci-lint | ShellCheck | Hadolint | Checkov | detect-secrets |
|------|---------|------|--------|--------|-----------|-----|------------|---------------|------------|----------|---------|----------------|
| `src/python/app.py` | x | x | x | | | | | | | | | x |
| `src/python/utils.py` | x | x | x | | | | | | | | | |
| `src/javascript/server.js` | x | | | x | | | | | | | | x |
| `src/javascript/utils.js` | x | | | x | | | | | | | | |
| `src/javascript/package.json` | | | | | x | | | | | | | |
| `src/typescript/api.ts` | x | | | x | | | | | | | | |
| `src/java/UserService.java` | x | | | | | x | x | | | | | x |
| `src/go/main.go` | x | | | | | | | x | | | | x |
| `src/ruby/app.rb` | x | | | | | | | | | | | x |
| `src/shell/deploy.sh` | | | | | | | | | x | | | x |
| `infra/Dockerfile` | | | | | | | | | | x | x | |
| `infra/main.tf` | | | | | | | | | | | x | x |
| `infra/docker-compose.yaml` | | | | | | | | | | | | x |
| `.env` | | | | | | | | | | | | x |

## Customization Testing

### Test different personas

Change `review_persona` in the workflow and compare output quality:

```yaml
review_persona: "strict"        # Flags everything
review_persona: "concise"       # Bullet points only
review_persona: "security-auditor"  # CWE categories
review_persona: "mentor"        # Educational (default)
```

### Test with .pr-review.json

Add this file to the repo root to test per-repo config:

```json
{
  "tools": {
    "enabled": ["semgrep", "ruff", "eslint", "detect_secrets"],
    "config": {
      "semgrep": { "rulesets": ["p/default", "p/owasp-top-ten"] },
      "ruff": { "select": ["E", "F", "B", "S"] }
    }
  },
  "review": {
    "persona": "mentor",
    "focus": ["security", "education"],
    "scoring": { "enabled": true }
  }
}
```

### Test tools="none" (LLM-only mode)

```yaml
tools: "none"
```

Compare the review quality with and without tool findings to see how much the static analysis context improves the LLM output.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Action doesn't trigger | Ensure workflow is on `main` branch and triggers on `pull_request` |
| "Resource not accessible by integration" | Enable write permissions in Settings > Actions > General |
| Tool installation timeout | Some Tier 2 tools take 30-60s to install on first run; check logs |
| "Too many files to review" | Increase `max_files` or narrow `files` glob pattern |
| Empty review | Check `logging: "debug"` output in Actions tab for errors |
