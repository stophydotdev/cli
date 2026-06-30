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

cat > "$OLD_BIN_DIR/stophy-managed" <<'EOF'
#!/usr/bin/env bash
echo "1.0.8"
EOF
ln -s "$OLD_BIN_DIR/stophy-managed" "$OLD_BIN_DIR/stophy"

chmod +x \
  "$TOOLS_DIR/uname" \
  "$TOOLS_DIR/curl" \
  "$TOOLS_DIR/tar" \
  "$TOOLS_DIR/shasum" \
  "$OLD_BIN_DIR/stophy-managed"

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

test "$("$OLD_BIN_DIR/stophy" --version)" = "1.0.9"
test ! -L "$OLD_BIN_DIR/stophy"
test ! -e "$HOME_DIR/.local/bin/stophy"
test ! -e "$HOME_DIR/.bashrc"
grep -Fq "Updating existing installation: $OLD_BIN_DIR/stophy" "$TEST_DIR/output.txt"
grep -Fq "Replacing the package-managed launcher" "$TEST_DIR/output.txt"

echo "install.sh upgrade test passed"
