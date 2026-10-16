#!/bin/bash
# Installs the latest portent into /Applications.
#   curl -fsSL https://adrianfernandezalv.github.io/portent-releases/install.sh | bash
# portent is self-signed, not notarized: this clears the quarantine flag so macOS opens it
# without the "unidentified developer" block. Read it before running it.
set -euo pipefail

REPO=adrianfernandezalv/portent-releases
APP=/Applications/Portent.app

[ "$(uname)" = Darwin ] || { echo "portent runs on macOS only." >&2; exit 1; }
major=$(sw_vers -productVersion | cut -d. -f1)
[ "${major}" -ge 14 ] || { echo "portent needs macOS 14 or later." >&2; exit 1; }

tag=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)
[ -n "${tag}" ] || { echo "Couldn't find the latest release." >&2; exit 1; }
version=${tag#v}
url="https://github.com/${REPO}/releases/download/${tag}/Portent-${version}.dmg"

tmp=$(mktemp -d)
trap 'hdiutil detach -quiet "${tmp}/mnt" 2>/dev/null || true; rm -rf "${tmp}"' EXIT
echo "Downloading portent ${version}..."
curl -fL --progress-bar "${url}" -o "${tmp}/Portent.dmg"
hdiutil attach -quiet -nobrowse -readonly -mountpoint "${tmp}/mnt" "${tmp}/Portent.dmg"

pkill -x Portent 2>/dev/null || true
rm -rf "${APP}"
cp -R "${tmp}/mnt/Portent.app" "${APP}"
xattr -dr com.apple.quarantine "${APP}" 2>/dev/null || true

echo "Installed portent ${version} in /Applications. It updates itself from now on."
open "${APP}"
