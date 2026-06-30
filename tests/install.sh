#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

HOME_DIR="$TEST_DIR/home"
TOOLS_DIR="$TEST_DIR/tools"
OLD_BIN_DIR="$TEST_DIR/old-bin"
mkdir -p "$HOME_DIR" "$TOOLS_DIR" "$OLD_BIN_DIR"

cat > "$TOOLS_DIR/uname" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -s) echo "Linux" ;;
  -m) echo "x86_64" ;;
esac
EOF

cat > "$TOOLS_DIR/curl" <<'EOF'
#!/usr/bin/env bash
destination=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    destination="$2"
    shift 2
  else
    shift
  fi
done

if [[ "$destination" == *checksums.txt ]]; then
  echo "fixture-hash  stophy-linux-x64.tar.gz" > "$destination"
elif [ -n "$destination" ]; then
  : > "$destination"
else
  printf '{"tag_name":"v1.0.9"}\n'
fi
EOF

cat > "$TOOLS_DIR/shasum" <<'EOF'
#!/usr/bin/env bash
echo "fixture-hash  $3"
EOF

cat > "$TOOLS_DIR/tar" <<'EOF'
#!/usr/bin/env bash
destination=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-C" ]; then
    destination="$2"
    shift 2
  else
    shift
  fi
done

cat > "$destination/stophy-linux-x64" <<'BINARY'
#!/usr/bin/env bash
echo "1.0.9"
BINARY
chmod +x "$destination/stophy-linux-x64"
EOF

cat > "$OLD_BIN_DIR/stophy" <<'EOF'
#!/usr/bin/env bash
echo "1.0.8"
EOF

chmod +x \
  "$TOOLS_DIR/uname" \
  "$TOOLS_DIR/curl" \
  "$TOOLS_DIR/tar" \
  "$TOOLS_DIR/shasum" \
  "$OLD_BIN_DIR/stophy"

PATH="$TOOLS_DIR:$OLD_BIN_DIR:/usr/bin:/bin:$HOME_DIR/.local/bin" \
  HOME="$HOME_DIR" \
  SHELL="/bin/bash" \
  STOPHY_VERSION="1.0.9" \
  bash "$ROOT_DIR/scripts/install.sh" > "$TEST_DIR/output.txt"

PATH="$TOOLS_DIR:$OLD_BIN_DIR:/usr/bin:/bin:$HOME_DIR/.local/bin" \
  HOME="$HOME_DIR" \
  SHELL="/bin/bash" \
  STOPHY_VERSION="1.0.9" \
  bash "$ROOT_DIR/scripts/install.sh" > /dev/null

test "$("$HOME_DIR/.local/bin/stophy" --version)" = "1.0.9"
grep -Fq "existing Stophy CLI at $OLD_BIN_DIR/stophy is shadowing" "$TEST_DIR/output.txt"
grep -Fqx "export PATH=\"$HOME_DIR/.local/bin:\$PATH\"" "$HOME_DIR/.bashrc"
test "$(grep -Fc "export PATH=\"$HOME_DIR/.local/bin:\$PATH\"" "$HOME_DIR/.bashrc")" = "1"

resolved_version="$({
  PATH="$TOOLS_DIR:$OLD_BIN_DIR:/usr/bin:/bin:$HOME_DIR/.local/bin" \
    HOME="$HOME_DIR" \
    bash --noprofile --norc -c 'source "$HOME/.bashrc"; stophy --version'
})"
test "$resolved_version" = "1.0.9"

echo "install.sh upgrade test passed"
