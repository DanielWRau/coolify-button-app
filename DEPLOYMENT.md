# Coolify Deployment Guide

## Deployment-Übersicht

Diese App ist für Coolify optimiert und nutzt Docker für das Deployment.

## Voraussetzungen

- Coolify-Installation
- Domain mit SSL-Zertifikat (automatisch via Coolify/Traefik)
- Browser-Use API Key (https://www.browser-use.com)
- LinkedIn Account für automatisierte Posts

## Deployment-Schritte

### 1. Projekt in Coolify erstellen

1. In Coolify einloggen
2. Neues Projekt erstellen oder bestehendes öffnen
3. "New Resource" → "Public Repository" wählen
4. Repository URL eingeben: `https://github.com/DanielWRau/coolify-button-app`
5. Branch: `main`
6. Build Pack: `Dockerfile`

### 2. Environment-Variablen konfigurieren

In Coolify unter "Environment Variables" folgende Variablen setzen:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# App Authentication (WICHTIG!)
APP_PASSWORD=dein_sicheres_passwort
SESSION_SECRET=generiere_einen_zufaelligen_string_mindestens_32_zeichen

# Browser-Use API
BROWSER_USE_API_KEY=dein_browser_use_api_key

# LinkedIn Credentials
LINKEDIN_EMAIL=deine_email@example.com
LINKEDIN_PASSWORD=dein_linkedin_passwort
```

**Wichtig:** 
- Alle Variablen als "Secret" markieren (außer PORT und NODE_ENV)
- `APP_PASSWORD`: Setze ein starkes Passwort für den App-Zugang
- `SESSION_SECRET`: Generiere einen zufälligen String (min. 32 Zeichen)

**Session Secret generieren:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Domain und SSL konfigurieren

1. In Coolify unter "Domains" deine Domain eintragen (z.B. `buttons.a-g-e-n-t.de`)
2. SSL wird automatisch via Let's Encrypt konfiguriert
3. HTTP → HTTPS Redirect aktivieren

**WICHTIG:** 
- **KEINE** Coolify Basic Auth aktivieren! 
- Die App hat eigene Session-basierte Authentifizierung
- Coolify Basic Auth verursacht SSL-Fehler (`SSL_ERROR_INTERNAL_ERROR_ALERT`)

### 4. Port-Konfiguration

- **Container Port:** 3000 (im Dockerfile definiert)
- **Public Port:** Wird von Coolify automatisch gemappt
- **Health Check:** `/health` Endpoint

### 5. Deployment starten

1. "Deploy" Button klicken
2. Build-Logs beobachten
3. Nach erfolgreichem Deployment App über Domain testen

### 6. Ersten Login durchführen

1. Navigiere zu `https://buttons.a-g-e-n-t.de`
2. Login-Seite erscheint automatisch
3. Gib `APP_PASSWORD` ein
4. Session bleibt 24 Stunden gültig

## Troubleshooting

### SSL_ERROR_INTERNAL_ERROR_ALERT

**Ursache:** Coolify Basic Auth ist aktiviert und verursacht TLS-Handshake-Fehler

**Lösung:**
1. In Coolify → Application → "Security" Tab
2. Basic Authentication **DEAKTIVIEREN**
3. App nutzt eigene Session-basierte Auth

### Container startet nicht ("exited")

**Prüfen:**
1. Logs in Coolify ansehen
2. Häufigste Ursachen:
   - Syntax-Fehler im Code
   - Fehlende Environment-Variablen
   - Port bereits belegt

**Debug:**
```bash
# Container-Logs ansehen
docker logs <container-name>

# Container Status prüfen
docker ps -a | grep button
```

### App startet nicht

1. **Logs prüfen:** In Coolify unter "Logs" die Container-Logs ansehen
2. **Environment-Variablen prüfen:** Alle required Variablen gesetzt?
3. **Health Check:** `/health` Endpoint muss 200 zurückgeben

### Browser-Use API funktioniert nicht

1. **API Key prüfen:** Ist `BROWSER_USE_API_KEY` korrekt gesetzt?
2. **API Limits:** Hast du noch API Credits?
3. **LinkedIn Credentials:** Email und Passwort korrekt?
4. **Endpoint:** Aktueller Endpoint ist `/api/v1/run-task`

### Session läuft ab

**Normal:** Sessions sind 24 Stunden gültig
**Lösung:** Einfach erneut einloggen mit `APP_PASSWORD`

## Monitoring

### Health Check

```bash
curl https://buttons.a-g-e-n-t.de/health
```

Erwartete Antwort:
```json
{"status":"ok"}
```

### Logs ansehen

In Coolify:
1. Application öffnen
2. "Logs" Tab
3. Live-Logs oder historische Logs ansehen

Erwartete Ausgabe beim Start:
```
Button Dashboard running on port 3000
Environment: production
Browser-Use API: Configured
LinkedIn Email: Configured
App Password: Custom
```

## Updates

### Automatisches Deployment

Coolify kann automatisch deployen bei Git-Push:

1. In Coolify: "Automatic Deployment" aktivieren
2. Webhook URL kopieren
3. In GitHub Repository Settings → Webhooks → Webhook URL eintragen

### Manuelles Deployment

1. Code in GitHub pushen
2. In Coolify "Deploy" Button klicken
3. Neuer Build startet automatisch

## Sicherheit

### Best Practices

1. **Secrets schützen:**
   - Alle API Keys und Passwörter als "Secret" markieren
   - Niemals in Code oder Logs committen
   - Starke Passwörter verwenden (min. 12 Zeichen)

2. **HTTPS erzwingen:**
   - Immer HTTPS Redirect aktivieren
   - Secure Cookies für Production

3. **Session Security:**
   - SESSION_SECRET regelmäßig rotieren
   - Session-Timeout bei 24h belassen

4. **Environment trennen:**
   - Separate Environments für Development und Production
   - Verschiedene API Keys pro Environment

5. **KEINE Coolify Basic Auth:**
   - Verursacht SSL-Probleme
   - App hat eigene Authentifizierung

## Authentication Flow

### Wie es funktioniert

1. **Erster Zugriff:** Benutzer wird zu `/login` umgeleitet
2. **Password-Check:** Server prüft gegen `APP_PASSWORD`
3. **Session erstellen:** Bei Erfolg wird Session-Cookie gesetzt
4. **Zugriff erlaubt:** User hat 24h Zugriff auf Dashboard
5. **Logout:** Optional via `/auth/logout` (Feature kann erweitert werden)

### Session-Details

- **Cookie Name:** Automatisch von express-session
- **Dauer:** 24 Stunden (86400000ms)
- **Secure:** Nur HTTPS in Production
- **HttpOnly:** Ja (XSS-Schutz)

## Nächste Schritte

1. **Custom Actions hinzufügen:**
   - Neue Buttons in `public/index.html` und `public/app.js`
   - API Endpoints in `server.js`

2. **Monitoring erweitern:**
   - Log-Aggregation Setup
   - Uptime-Monitoring

3. **Backup-Strategie:**
   - Regelmäßige Backups der Environment-Variablen
   - Disaster Recovery Plan

4. **Multi-User Support (Optional):**
   - Erweitere Auth-System für mehrere Benutzer
   - User-Management Interface

## Support

Bei Problemen:
1. Coolify Logs prüfen
2. Browser-Use API Status prüfen
3. Domain-DNS-Konfiguration verifizieren
4. SSL-Zertifikat Status in Coolify checken
5. **WICHTIG:** Coolify Basic Auth deaktivieren!

## Quick Checklist

- [ ] Repository in Coolify verbunden
- [ ] Alle Environment-Variablen gesetzt
- [ ] `APP_PASSWORD` geändert (nicht "changeme123")
- [ ] `SESSION_SECRET` generiert (min. 32 Zeichen)
- [ ] Domain konfiguriert
- [ ] SSL-Zertifikat generiert
- [ ] **Coolify Basic Auth DEAKTIVIERT**
- [ ] HTTPS Redirect aktiviert
- [ ] Health Check funktioniert
- [ ] Erster Login erfolgreich
- [ ] Browser-Use API getestet
