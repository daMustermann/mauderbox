# GitHub Secrets einrichten - Schritt für Schritt

## Was sind GitHub Secrets?

GitHub Secrets sind verschlüsselte Umgebungsvariablen, die du in deinem Repository speicherst. Sie werden verwendet, um sensible Daten (wie Passwörter, API-Keys) sicher zu speichern, ohne sie im Code zu haben.

## Warum brauchen wir das?

Für Auto-Updates muss jede neue Version **signiert** werden. Die Signatur beweist, dass das Update wirklich von dir kommt und nicht manipuliert wurde. Dafür brauchen wir:

1. **Private Key** (geheim halten!) - zum Signieren
2. **Public Key** (öffentlich, bereits in der App) - zum Verifizieren

## Schritt 1: Private Key auslesen

Öffne PowerShell und führe aus:

```powershell
Get-Content $env:USERPROFILE\.tauri\mauderbox.key -Raw
```

Du siehst etwas wie:

```
untrusted comment: Tauri secret key
RWRTcnk...VIELE_ZEICHEN...xyz==
```

**WICHTIG:** Kopiere den **GESAMTEN** Text (beide Zeilen)!

## Schritt 2: Passwort notieren

Das Passwort, das du beim Generieren der Keys eingegeben hast (als ich `bun tauri signer generate` ausgeführt habe).

## Schritt 3: Zu GitHub gehen

1. Öffne deinen Browser
2. Gehe zu: https://github.com/daMustermann/mauderbox
3. Klicke auf **Settings** (oben rechts)
4. In der linken Sidebar: **Secrets and variables** → **Actions**

## Schritt 4: Erstes Secret hinzufügen

1. Klicke auf **"New repository secret"**
2. Name: `TAURI_SIGNING_PRIVATE_KEY`
3. Value: Füge den **kompletten Text** vom Private Key ein (beide Zeilen!)
4. Klicke **"Add secret"**

## Schritt 5: Zweites Secret hinzufügen

1. Klicke wieder auf **"New repository secret"**
2. Name: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
3. Value: Dein Passwort
4. Klicke **"Add secret"**

## Schritt 6: Fertig! 🎉

Jetzt solltest du 2 Secrets sehen:
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

## So sieht es aus:

```
┌─────────────────────────────────────────────────────┐
│  Settings > Secrets and variables > Actions         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Repository secrets                                 │
│                                                      │
│  [New repository secret]                            │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ ✓ TAURI_SIGNING_PRIVATE_KEY                │    │
│  │   Updated 1 minute ago                      │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ ✓ TAURI_SIGNING_PRIVATE_KEY_PASSWORD       │    │
│  │   Updated 1 minute ago                      │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Was passiert danach?

Wenn du einen Tag pushst (z.B. `v0.2.3`):

1. GitHub Actions startet automatisch
2. Baut die App für Windows
3. **Signiert** den Installer mit deinem Private Key
4. Erstellt `latest.json` mit der Signatur
5. Veröffentlicht alles als Draft Release

## Wie erstelle ich einen Release?

```bash
# Im Projekt-Ordner
cd f:\Coding\voicebox

# Version erhöhen (manuell in tauri.conf.json und Cargo.toml)
# Zum Beispiel: 0.2.2 -> 0.2.3

# Änderungen committen
git add -A
git commit -m "Bump version to 0.2.3"

# Tag erstellen
git tag v0.2.3

# Pushen
git push
git push origin v0.2.3
```

Dann:
1. Warte ca. 10-15 Minuten (Build läuft)
2. Gehe zu https://github.com/daMustermann/mauderbox/releases
3. Du siehst einen **Draft** Release
4. Klicke **Edit**, füge Release Notes hinzu
5. Klicke **Publish release**

## Wie funktioniert das Auto-Update für User?

1. User startet Mauderbox
2. App prüft GitHub: "Gibt es ein Update?"
3. GitHub liefert `latest.json` mit Version + Signatur
4. App vergleicht: Aktuelle Version < Neue Version?
5. Wenn ja → Zeigt Update-Dialog
6. User klickt "Update herunterladen"
7. App lädt `.nsis.zip` herunter
8. App **verifiziert Signatur** (mit Public Key)
9. User klickt "Installieren & neu starten"
10. Installer läuft, App startet neu → ✨ Updated!

## Sicherheit

- **Private Key**: Nur in GitHub Secrets, NIEMALS im Code
- **Public Key**: In der App (tauri.conf.json), öffentlich sichtbar
- **Signatur**: Beweist, dass Update von dir kommt
- Ohne korrekten Private Key kann niemand gefälschte Updates erstellen

## Troubleshooting

### "Repository not found" beim Push

→ Stelle sicher, dass das Repo existiert und du eingeloggt bist

### "Secret not found" im GitHub Actions Log

→ Prüfe, ob die Secrets richtig benannt sind (exact match!)

### "Invalid signature"

→ Private Key oder Passwort falsch → Secrets nochmal neu anlegen

## Fragen?

Schau in `AUTOUPDATER_SETUP.md` oder frag mich! 😊
