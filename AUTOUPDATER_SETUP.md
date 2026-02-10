# Auto-Updater Setup für Mauderbox

## GitHub Secrets einrichten

Für automatische Releases und Updates müssen folgende Secrets in GitHub eingerichtet werden:

### 1. TAURI_SIGNING_PRIVATE_KEY

Der private Schlüssel für das Signieren der Updates:

```powershell
# Schlüssel auslesen (auf Windows)
Get-Content $env:USERPROFILE\.tauri\mauderbox.key -Raw
```

Kopiere den **gesamten Inhalt** (inkl. aller Zeilen) und füge ihn als Secret mit dem Namen `TAURI_SIGNING_PRIVATE_KEY` hinzu.

### 2. TAURI_SIGNING_PRIVATE_KEY_PASSWORD

Das Passwort, das du beim Generieren der Keys eingegeben hast.

Füge es als Secret mit dem Namen `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` hinzu.

## Release erstellen

### Automatisch via GitHub Actions

1. Erstelle einen Tag mit der Version:
   ```bash
   git tag v0.2.3
   git push origin v0.2.3
   ```

2. GitHub Actions baut automatisch die Installer und erstellt einen Draft Release

3. Bearbeite den Draft Release, füge Release Notes hinzu und veröffentliche ihn

### Manuell

Wenn du lokal einen Build mit Signatur erstellen willst:

```powershell
# Setze die Umgebungsvariablen
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $env:USERPROFILE\.tauri\mauderbox.key -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "DEIN_PASSWORT"

# Baue die App
cd tauri
bun run tauri build
```

Die signierten Installer und `latest.json` findest du dann in:
- `tauri/src-tauri/target/release/bundle/nsis/`

## Wie funktioniert Auto-Update?

1. Die App prüft beim Start auf Updates (über `useAutoUpdater` Hook)
2. Wenn ein Update verfügbar ist, wird ein Dialog angezeigt
3. User kann das Update herunterladen und installieren
4. Nach Installation wird die App neu gestartet

## Public Key

Der Public Key ist bereits in `tauri/src-tauri/tauri.conf.json` konfiguriert:
```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDI3ODk4REIxQ0IwMkNGNkIKUldScnp3TExzWTJKSnludit6V2lObHpBem5IUnRLeFJBS2d1QW1MdHNxRXoxSmNBdnI0a0hRUXYK
```

**WICHTIG:** Bewahre den Private Key (`~/.tauri/mauderbox.key`) sicher auf! Ohne ihn können keine Updates signiert werden.
