# Local Testing Guide

Test the PR Code Review Action on your machine before deploying to GitHub.

## Prerequisites

- Python 3.12+
- Docker (for container-based testing)
- A GitHub Personal Access Token (classic) with `repo` scope
- An OpenAI API key
- A **real PR** on a GitHub repo to test against (you'll need its PR number)

---

## Method 1: Direct Python (Fastest)

Runs the action code directly — no Docker, quickest feedback loop.

### 1. Install dependencies

```bash
cd /path/to/chatgpt-pr-review
pip install -r requirements.txt
```

### 2. Set environment variables

```bash
# Required
export INPUT_OPENAI_API_KEY="sk-..."
export INPUT_GITHUB_TOKEN="ghp_..."
export INPUT_GITHUB_PR_ID="1"                          # real PR number
export GITHUB_REPOSITORY="your-username/pr-review-testing"  # owner/repo

# Point to the checked-out testing repo so tools can scan the filesystem
export GITHUB_WORKSPACE="/path/to/testing_repo"

# Optional — tweak as needed
export INPUT_OPENAI_MODEL="gpt-5.4-mini-2026-03-17"
export INPUT_OPENAI_TEMPERATURE="1"
export INPUT_OPENAI_MAX_TOKENS="32000"
export INPUT_TOOLS="auto"                  # or "none", "semgrep,ruff", etc.
export INPUT_REVIEW_PERSONA="mentor"       # mentor | strict | concise | security-auditor
export INPUT_REVIEW_FOCUS="all"
export INPUT_SEVERITY_THRESHOLD="low"
export INPUT_ENABLE_SCORING="true"
export INPUT_MAX_FILES="20"
export INPUT_LOGGING="debug"               # debug shows full prompts and tool output
```

### 3. Run

```bash
python -m src.main
```

### Quick iteration tips

**LLM-only (skip tools, fastest):**
```bash
export INPUT_TOOLS="none"
python -m src.main
```

**Single tool test:**
```bash
export INPUT_TOOLS="ruff"       # only runs Ruff
python -m src.main
```

**Specific files only:**
```bash
export INPUT_FILES="*.py"       # only review Python files
python -m src.main
```

---

## Method 2: Docker (Tests the Full Container)

Tests the exact same image that GitHub Actions will run.

### 1. Build

```bash
cd /path/to/chatgpt-pr-review
docker build -t pr-review-test .
```

> First build takes a few minutes (installs Semgrep, Ruff, detect-secrets).

### 2. Run against a real PR

```bash
docker run --rm \
  -e INPUT_OPENAI_API_KEY="sk-..." \
  -e INPUT_GITHUB_TOKEN="ghp_..." \
  -e INPUT_GITHUB_PR_ID="1" \
  -e GITHUB_REPOSITORY="your-username/pr-review-testing" \
  -e GITHUB_WORKSPACE="/workspace" \
  -e INPUT_TOOLS="auto" \
  -e INPUT_REVIEW_PERSONA="mentor" \
  -e INPUT_ENABLE_SCORING="true" \
  -e INPUT_MAX_FILES="20" \
  -e INPUT_LOGGING="debug" \
  -v /path/to/testing_repo:/workspace \
  pr-review-test
```

The `-v` mount gives tools filesystem access to scan. Without it, tools are skipped and you get LLM-only review.

### Test specific tool tiers

```bash
# Tier 1 only (pre-installed, instant)
-e INPUT_TOOLS="semgrep,ruff,detect_secrets"

# Tier 2 (installed at runtime, adds ~30s)
-e INPUT_TOOLS="semgrep,eslint,bandit"

# All auto-detected tools
-e INPUT_TOOLS="auto"
```

---

## Method 3: `act` (Full Workflow Simulation)

[`act`](https://github.com/nektos/act) simulates GitHub Actions locally. This is the most realistic test — it runs the actual workflow YAML.

### 1. Install act

```bash
# macOS
brew install act

# Linux
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### 2. Create secrets file

```bash
cd /path/to/testing_repo

# Create .secrets (DO NOT commit this file)
cat > .secrets <<'EOF'
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
EOF
```

### 3. Create event payload

```bash
cat > event.json <<'EOF'
{
  "pull_request": {
    "number": 1
  }
}
```

### 4. Run

```bash
act pull_request \
  --secret-file .secrets \
  --eventpath event.json \
  --container-architecture linux/amd64 \
  --env GITHUB_REPOSITORY="your-username/pr-review-testing"
```

> `act` builds the Docker image and runs the full workflow. First run is slow; subsequent runs use cached layers.

### Troubleshooting act

| Issue | Fix |
|-------|-----|
| `permission denied` on entrypoint.sh | Run `chmod +x entrypoint.sh` before building |
| Docker socket errors on macOS | Ensure Docker Desktop is running |
| `--container-architecture` errors | Remove the flag if on Linux x86_64 |
| Image build fails | Try `act --rebuild` to clear cache |

---

## Method 4: Unit-Test Individual Tools

Test that each analyzer parses output correctly without calling the LLM or GitHub API.

### Test a single tool directly

```bash
cd /path/to/chatgpt-pr-review
python3 <<'EOF'
from src.tools.analyzers.ruff_tool import RuffTool

tool = RuffTool()
print(f"Available: {tool.is_available()}")

if tool.is_available():
    result = tool.run(
        files=["../testing_repo/src/python/app.py", "../testing_repo/src/python/utils.py"],
        workspace="../testing_repo",
        config={"select": ["E", "F", "B", "S"]},
    )
    print(f"Findings: {len(result.findings)}")
    for f in result.findings[:5]:
        print(f"  [{f.severity}] {f.file}:{f.line} {f.rule_id}: {f.message}")
EOF
```

### Test stack detection

```bash
python3 <<'EOF'
from src.tools.stack_detector import detect_stack

files = [
    "src/python/app.py",
    "src/javascript/server.js",
    "src/go/main.go",
    "infra/Dockerfile",
    "src/shell/deploy.sh",
]
detected = detect_stack(files, "../testing_repo")
print(f"Detected stack: {detected}")
EOF
```

### Test tool registry

```bash
python3 <<'EOF'
from src.tools.registry import discover_tools, get_tools_for_config

all_tools = discover_tools()
print(f"Registered tools: {list(all_tools.keys())}")

tools = get_tools_for_config(
    detected_languages=["python", "javascript"],
    tools_setting="auto",
)
print(f"Selected for Python+JS: {[t.name for t in tools]}")
EOF
```

### Test prompt builder

```bash
python3 <<'EOF'
from src.config import Config
from src.llm.openai_provider import OpenAIProvider
from src.prompt.builder import build_prompt

config = Config(review_persona="mentor", enable_scoring=True)
llm = OpenAIProvider(api_key="dummy")  # only used for token counting

prompt = build_prompt(
    filename="app.py",
    contents="def hello():\n    print('world')\n",
    pr_description="Add greeting function",
    comments=["Looks good"],
    readme="# My App",
    tool_findings="[HIGH] (semgrep:sql-injection) Line 10: SQL injection detected",
    config=config,
    llm=llm,
)
print(f"System message ({len(prompt.system_message)} chars):")
print(prompt.system_message[:200], "...\n")
print(f"User message ({len(prompt.user_message)} chars):")
print(prompt.user_message[:500], "...\n")
print(f"Total tokens: {prompt.total_tokens}")
EOF
```

---

## Dry-Run Checklist

Use this checklist to verify each component works before deploying:

```
[ ] pip install -r requirements.txt succeeds
[ ] python -m src.main runs with INPUT_TOOLS="none" and posts a review
[ ] Ruff finds issues in testing_repo/src/python/app.py
[ ] Semgrep finds issues (requires: pip install semgrep)
[ ] detect-secrets finds hardcoded keys in testing_repo/src/python/app.py
[ ] Stack detector identifies python, javascript, go, shell, dockerfile
[ ] Token counting works (no tiktoken errors)
[ ] Docker build completes (docker build -t test .)
[ ] Docker run posts a review successfully
[ ] Scoring rubric appears in review when enable_scoring=true
[ ] Different personas produce different review styles
```

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `INPUT_OPENAI_API_KEY` | Yes | OpenAI API key |
| `INPUT_GITHUB_TOKEN` | Yes | GitHub token with repo/PR write access |
| `INPUT_GITHUB_PR_ID` | Yes | PR number to review |
| `GITHUB_REPOSITORY` | Yes | `owner/repo` format |
| `GITHUB_WORKSPACE` | For tools | Path to checked-out repo root |
| `INPUT_OPENAI_MODEL` | No | Default: `gpt-5.4-mini-2026-03-17` |
| `INPUT_OPENAI_TEMPERATURE` | No | Default: `1` |
| `INPUT_OPENAI_MAX_TOKENS` | No | Default: `32000` |
| `INPUT_TOOLS` | No | `auto`, `none`, or comma-separated list |
| `INPUT_REVIEW_PERSONA` | No | `mentor`, `strict`, `concise`, `security-auditor` |
| `INPUT_REVIEW_FOCUS` | No | `all`, `security`, `quality`, `performance`, `education` |
| `INPUT_SEVERITY_THRESHOLD` | No | `critical`, `high`, `medium`, `low`, `info` |
| `INPUT_ENABLE_SCORING` | No | `true` or `false` |
| `INPUT_MAX_FILES` | No | Default: `10` |
| `INPUT_FILES` | No | Glob patterns, default: `*` |
| `INPUT_LOGGING` | No | `debug`, `info`, `warning`, `error` |
| `INPUT_LLM_PROVIDER` | No | `openai` or `anthropic` |
| `INPUT_API_BASE_URL` | No | Custom API endpoint |
| `INPUT_ANTHROPIC_API_KEY` | No | For Claude provider |
