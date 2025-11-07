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

# Browser-Use API
BROWSER_USE_API_KEY=dein_browser_use_api_key

# LinkedIn Credentials
LINKEDIN_EMAIL=deine_email@example.com
LINKEDIN_PASSWORD=dein_linkedin_passwort
```

**Wichtig:** Alle Variablen als "Secret" markieren (außer PORT und NODE_ENV).

### 3. Domain und SSL konfigurieren

1. In Coolify unter "Domains" deine Domain eintragen (z.B. `buttons.a-g-e-n-t.de`)
2. SSL wird automatisch via Let's Encrypt konfiguriert
3. HTTP → HTTPS Redirect aktivieren

### 4. Port-Konfiguration

- **Container Port:** 3000 (im Dockerfile definiert)
- **Public Port:** Wird von Coolify automatisch gemappt
- **Health Check:** `/health` Endpoint

### 5. Deployment starten

1. "Deploy" Button klicken
2. Build-Logs beobachten
3. Nach erfolgreichem Deployment App über Domain testen

## Troubleshooting

### SSL_ERROR_INTERNAL_ERROR_ALERT

Dieser Fehler tritt auf, wenn:

1. **SSL-Zertifikat noch nicht generiert:** 
   - Warte 2-5 Minuten nach dem ersten Deployment
   - Coolify generiert automatisch Let's Encrypt Zertifikate

2. **Domain-DNS nicht korrekt:**
   - Prüfe, ob DNS A-Record auf Coolify-Server IP zeigt
   - DNS-Propagation kann bis zu 24h dauern

3. **Port-Mapping-Problem:**
   - Stelle sicher, dass Container Port 3000 ist
   - Coolify mappt automatisch auf öffentlichen Port

### App startet nicht

1. **Logs prüfen:** In Coolify unter "Logs" die Container-Logs ansehen
2. **Environment-Variablen prüfen:** Alle required Variablen gesetzt?
3. **Health Check:** `/health` Endpoint muss 200 zurückgeben

### Browser-Use API funktioniert nicht

1. **API Key prüfen:** Ist `BROWSER_USE_API_KEY` korrekt gesetzt?
2. **API Limits:** Hast du noch API Credits?
3. **LinkedIn Credentials:** Email und Passwort korrekt?

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

2. **HTTPS erzwingen:**
   - Immer HTTPS Redirect aktivieren
   - HTTP-Only Cookies für Sessions

3. **Environment trennen:**
   - Separate Environments für Development und Production
   - Verschiedene API Keys pro Environment

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

## Support

Bei Problemen:
1. Coolify Logs prüfen
2. Browser-Use API Status prüfen
3. Domain-DNS-Konfiguration verifizieren
