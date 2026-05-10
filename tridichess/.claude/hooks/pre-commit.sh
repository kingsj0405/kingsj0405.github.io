#!/usr/bin/env sh
#
# tridichess/.claude/hooks/pre-commit.sh
#
# tridichess/ 하위 파일이 staged 일 때만 vitest 실행.
# git 저장소 root: kingsj0405.github.io/ — tridichess/ 외 변경에는 영향 없음.
#
# 설치: 저장소 root 에서
#   ln -sf ../../tridichess/.claude/hooks/pre-commit.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# 우회: 사용 금지 (CLAUDE.md §2-7). 실패 시 원인 수정.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
TRIDI_DIR="$REPO_ROOT/tridichess"

# tridichess/ 하위에 staged 변경이 있는지 확인
STAGED_IN_TRIDI=$(git diff --cached --name-only --diff-filter=ACMR | grep '^tridichess/' || true)

if [ -z "$STAGED_IN_TRIDI" ]; then
  exit 0
fi

echo "▶ tridichess: pre-commit vitest 실행"
cd "$TRIDI_DIR"

# node_modules 없으면 안내 후 통과 (개발 환경 미설치 시 막지 않음)
if [ ! -d node_modules ]; then
  echo "  ⚠ node_modules 없음. 'cd tridichess && npm install' 후 재시도 권장."
  echo "  ⚠ 이번 커밋은 테스트 없이 통과시킴."
  exit 0
fi

npm test --silent
