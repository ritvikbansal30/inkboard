#!/bin/zsh
# Double-click once: creates Inkboard.app in your Applications folder, with its own Dock icon.
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$HOME/Applications/Inkboard.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$DIR/Inkboard.icns" "$APP/Contents/Resources/Inkboard.icns"
cat > "$APP/Contents/Info.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Inkboard</string>
  <key>CFBundleDisplayName</key><string>Inkboard</string>
  <key>CFBundleIdentifier</key><string>com.ritvikbansal.inkboard</string>
  <key>CFBundleExecutable</key><string>Inkboard</string>
  <key>CFBundleIconFile</key><string>Inkboard</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1.0</string>
</dict></plist>
PL
cat > "$APP/Contents/MacOS/Inkboard" <<SH
#!/bin/zsh
# Starts Inkboard's local server (if needed) and opens it in its own app window.
cd "$DIR"
PORT=8777
if ! /usr/sbin/lsof -i :\$PORT >/dev/null 2>&1; then
  nohup /usr/bin/python3 -m http.server \$PORT --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 0.8
fi
URL="http://127.0.0.1:\$PORT/index.html"
for B in "Google Chrome" "Microsoft Edge" "Brave Browser" "Chromium"; do
  if open -Ra "\$B" >/dev/null 2>&1; then open -na "\$B" --args --app="\$URL"; exit 0; fi
done
open "\$URL"
SH
chmod +x "$APP/Contents/MacOS/Inkboard"
touch "$APP"
echo "Inkboard.app is ready in ~/Applications. Drag it to your Dock."
open -R "$APP"
