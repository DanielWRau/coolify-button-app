# Chrome DevTools MCP - Test Spezifikationen

## Test-Umgebung Setup

### Voraussetzungen
- Chrome Browser installiert
- Chrome DevTools MCP Server läuft
- Test-Webseite verfügbar (z.B. localhost:3000)
- Netzwerkverbindung aktiv

### Test-Daten
- Test-URL: `https://buttons.a-g-e-n-t.de`
- Fallback-URL: `http://localhost:3000`
- Test-Credentials (falls Login benötigt)

---

## 1. Page Management Tests

### 1.1 Page Navigation Tests

#### TEST-NAV-001: Navigate to URL
**Beschreibung:** Navigiere zu einer gültigen URL
**Voraussetzungen:** Chrome geöffnet
**Schritte:**
1. `navigate_page` mit URL `https://buttons.a-g-e-n-t.de`
2. Warte auf Seitenladevorgang

**Erwartetes Ergebnis:**
- Status: Success
- Seite wird geladen
- URL in Adressleiste korrekt

**Fehlerfall:**
- Timeout nach 30s
- Invalid URL Error
- Network Error

---

#### TEST-NAV-002: Navigate with custom timeout
**Beschreibung:** Navigation mit spezifischem Timeout
**Schritte:**
1. `navigate_page` mit timeout=5000ms
2. URL die langsam lädt

**Erwartetes Ergebnis:**
- Timeout wird respektiert
- Error nach 5s wenn nicht geladen

---

#### TEST-NAV-003: Back/Forward Navigation
**Beschreibung:** Browser History Navigation
**Schritte:**
1. Navigate zu Seite A
2. Navigate zu Seite B
3. `navigate_page_history` mit "back"
4. `navigate_page_history` mit "forward"

**Erwartetes Ergebnis:**
- Back: Zurück zu Seite A
- Forward: Wieder zu Seite B

---

### 1.2 Page Lifecycle Tests

#### TEST-PAGE-001: List Pages
**Beschreibung:** Alle offenen Pages auflisten
**Schritte:**
1. Öffne 3 verschiedene Tabs
2. `list_pages`

**Erwartetes Ergebnis:**
- Array mit 3 Page-Objekten
- Jedes Objekt hat: index, url, title

---

#### TEST-PAGE-002: Create New Page
**Beschreibung:** Neuen Tab öffnen
**Schritte:**
1. `new_page` mit URL
2. `list_pages` zur Verifizierung

**Erwartetes Ergebnis:**
- Neuer Tab wird geöffnet
- Navigation zur URL erfolgt
- Page count +1

---

#### TEST-PAGE-003: Select Page
**Beschreibung:** Zwischen Tabs wechseln
**Schritte:**
1. Öffne 3 Tabs (Index 0, 1, 2)
2. `select_page` mit Index 1
3. Führe Aktion aus (z.B. snapshot)

**Erwartetes Ergebnis:**
- Tab 1 wird aktiv
- Aktionen wirken auf Tab 1

---

#### TEST-PAGE-004: Close Page
**Beschreibung:** Tab schließen
**Schritte:**
1. Öffne 3 Tabs
2. `close_page` mit Index 1
3. `list_pages`

**Erwartetes Ergebnis:**
- Tab 1 geschlossen
- Nur noch 2 Tabs übrig
- Indizes neu berechnet (0, 1)

**Edge Case:**
- Letzten Tab kann nicht schließen

---

#### TEST-PAGE-005: Resize Page
**Beschreibung:** Browser-Fenster Größe ändern
**Schritte:**
1. `resize_page` width=1024, height=768
2. Screenshot machen
3. Größe verifizieren

**Erwartetes Ergebnis:**
- Viewport: 1024x768
- Layout responsive angepasst

**Test-Cases:**
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

---

## 2. User Interaction Tests

### 2.1 Click Interactions

#### TEST-CLICK-001: Simple Click
**Beschreibung:** Element anklicken
**Voraussetzungen:**
- Seite geladen mit Button (uid bekannt)

**Schritte:**
1. `take_snapshot` für UIDs
2. `click` auf Button-UID
3. Verifiziere Aktion (z.B. Modal öffnet)

**Erwartetes Ergebnis:**
- Click registriert
- Button-Aktion ausgeführt

---

#### TEST-CLICK-002: Double Click
**Beschreibung:** Doppelklick auf Element
**Schritte:**
1. `click` mit dblClick=true
2. Verifiziere Doppelklick-Aktion

**Erwartetes Ergebnis:**
- Doppelklick registriert
- Nur 1 Event gefeuert (nicht 2 separate)

---

#### TEST-CLICK-003: Click Invalid UID
**Beschreibung:** Fehlerbehandlung bei ungültigem UID
**Schritte:**
1. `click` mit uid="invalid-123"

**Erwartetes Ergebnis:**
- Error: Element not found
- Status Code: 404 oder ähnlich

---

### 2.2 Form Interactions

#### TEST-FORM-001: Fill Single Input
**Beschreibung:** Textfeld ausfüllen
**Schritte:**
1. `take_snapshot`
2. Finde Input UID
3. `fill` mit uid und value="Test Text"
4. Verifiziere Wert im Input

**Erwartetes Ergebnis:**
- Input enthält "Test Text"
- onChange Events gefeuert

---

#### TEST-FORM-002: Fill Form (Multiple Fields)
**Beschreibung:** Komplettes Formular ausfüllen
**Schritte:**
1. `fill_form` mit Array:
   ```json
   [
     {"uid": "name-input", "value": "Max Mustermann"},
     {"uid": "email-input", "value": "max@test.de"},
     {"uid": "message-textarea", "value": "Test message"}
   ]
   ```

**Erwartetes Ergebnis:**
- Alle Felder ausgefüllt
- Validation triggert (falls vorhanden)

---

#### TEST-FORM-003: Select Dropdown
**Beschreibung:** Dropdown-Option auswählen
**Schritte:**
1. `fill` auf Select-Element
2. value="option2"

**Erwartetes Ergebnis:**
- Option 2 ausgewählt
- onChange Event

---

#### TEST-FORM-004: Upload File
**Beschreibung:** Datei hochladen
**Schritte:**
1. Bereite Test-Datei vor
2. `upload_file` mit uid und filePath
3. Verifiziere Upload

**Erwartetes Ergebnis:**
- Datei ausgewählt
- Filename angezeigt
- Upload triggert

**Test-Cases:**
- PDF: test.pdf
- Bild: image.png
- Text: document.txt

---

### 2.3 Advanced Interactions

#### TEST-INT-001: Hover
**Beschreibung:** Mouse Hover über Element
**Schritte:**
1. `hover` über Element
2. Warte 500ms
3. Screenshot/Snapshot

**Erwartetes Ergebnis:**
- Hover-Effekt sichtbar
- Tooltip/Popover erscheint

---

#### TEST-INT-002: Drag and Drop
**Beschreibung:** Element von A nach B ziehen
**Schritte:**
1. `drag` from_uid="draggable" to_uid="dropzone"
2. Verifiziere Position

**Erwartetes Ergebnis:**
- Element verschoben
- Drop-Event gefeuert
- UI aktualisiert

---

## 3. Content Inspection Tests

### 3.1 Snapshot Tests

#### TEST-SNAP-001: Take Page Snapshot
**Beschreibung:** Seitenstruktur als Text erfassen
**Schritte:**
1. Navigiere zu Testseite
2. `take_snapshot`

**Erwartetes Ergebnis:**
- Strukturierter Text-Output
- Alle Elemente mit UIDs
- Hierarchie erkennbar

**Prüfe:**
- Headings erfasst
- Buttons mit UIDs
- Links mit URLs
- Forms mit Inputs

---

#### TEST-SNAP-002: Snapshot after Interaction
**Beschreibung:** Snapshot nach DOM-Änderung
**Schritte:**
1. Initial Snapshot
2. Klick öffnet Modal
3. Snapshot nach Modal

**Erwartetes Ergebnis:**
- Neues Modal in Snapshot
- Neue UIDs für Modal-Elemente
- Background-Elemente noch da

---

### 3.2 Screenshot Tests

#### TEST-SCREEN-001: Full Page Screenshot
**Beschreibung:** Screenshot der gesamten Seite
**Schritte:**
1. `take_screenshot` mit fullPage=true

**Erwartetes Ergebnis:**
- PNG/JPEG/WebP Datei
- Ganze Seite (auch below fold)
- Korrekte Dimensionen

---

#### TEST-SCREEN-002: Element Screenshot
**Beschreibung:** Screenshot eines Elements
**Schritte:**
1. `take_snapshot` für UID
2. `take_screenshot` mit uid="specific-element"

**Erwartetes Ergebnis:**
- Screenshot nur des Elements
- Korrekte Crop-Grenzen

---

#### TEST-SCREEN-003: Screenshot with Quality
**Beschreibung:** Kompression testen
**Schritte:**
1. Screenshot mit format="jpeg", quality=50
2. Screenshot mit format="jpeg", quality=100

**Erwartetes Ergebnis:**
- Quality 50: Kleinere Datei, sichtbare Kompression
- Quality 100: Größere Datei, beste Qualität

---

#### TEST-SCREEN-004: Save to File
**Beschreibung:** Screenshot direkt speichern
**Schritte:**
1. `take_screenshot` mit filePath="./test-output/screenshot.png"

**Erwartetes Ergebnis:**
- Datei gespeichert unter filePath
- Nicht als Base64 zurück

---

## 4. Network Tests

### 4.1 Network Monitoring

#### TEST-NET-001: List All Requests
**Beschreibung:** Alle Netzwerk-Requests auflisten
**Schritte:**
1. `navigate_page` zu Seite mit API-Calls
2. Warte bis Seite geladen
3. `list_network_requests`

**Erwartetes Ergebnis:**
- Array aller Requests
- Jeder mit: url, method, status, type

---

#### TEST-NET-002: Filter by Resource Type
**Beschreibung:** Nur bestimmte Request-Typen
**Schritte:**
1. `list_network_requests` mit resourceTypes=["xhr", "fetch"]

**Erwartetes Ergebnis:**
- Nur AJAX/Fetch Requests
- Keine Images/CSS/Scripts

---

#### TEST-NET-003: Pagination
**Beschreibung:** Große Request-Liste paginieren
**Schritte:**
1. Seite mit 100+ Requests
2. `list_network_requests` pageSize=20, pageIdx=0
3. `list_network_requests` pageSize=20, pageIdx=1

**Erwartetes Ergebnis:**
- Erste Seite: Requests 0-19
- Zweite Seite: Requests 20-39

---

#### TEST-NET-004: Get Request Details
**Beschreibung:** Details eines spezifischen Requests
**Schritte:**
1. `list_network_requests` → finde URL
2. `get_network_request` mit URL

**Erwartetes Ergebnis:**
- Headers (Request + Response)
- Body/Payload
- Timing-Informationen
- Response Status

---

### 4.2 Network Conditions

#### TEST-NET-005: Throttle Network
**Beschreibung:** Slow 3G simulieren
**Schritte:**
1. `emulate_network` throttlingOption="Slow 3G"
2. Navigate zu Seite
3. Messe Ladezeit

**Erwartetes Ergebnis:**
- Langsame Ladezeiten
- Resources delayed
- Realistische 3G-Simulation

**Test-Cases:**
- No emulation: Baseline
- Slow 3G: ~400ms RTT
- Fast 3G: ~150ms RTT
- Slow 4G: ~100ms RTT
- Fast 4G: ~50ms RTT

---

#### TEST-NET-006: Disable Throttling
**Beschreibung:** Throttling zurücksetzen
**Schritte:**
1. Enable "Slow 3G"
2. `emulate_network` throttlingOption="No emulation"
3. Navigate

**Erwartetes Ergebnis:**
- Normale Geschwindigkeit
- Throttling deaktiviert

---

## 5. Performance Tests

### 5.1 CPU Emulation

#### TEST-PERF-001: CPU Throttling
**Beschreibung:** Langsame CPU simulieren
**Schritte:**
1. `emulate_cpu` throttlingRate=4 (4x slower)
2. Navigate zu JS-heavy Seite
3. Messe Render-Zeit

**Erwartetes Ergebnis:**
- Script-Execution verlangsamt
- Render dauert 4x länger

**Test-Cases:**
- Rate 1: No throttling
- Rate 4: Mid-range device
- Rate 6: Low-end device
- Rate 20: Extreme throttling

---

#### TEST-PERF-002: Disable CPU Throttling
**Beschreibung:** Throttling zurücksetzen
**Schritte:**
1. Enable Rate 4
2. `emulate_cpu` throttlingRate=1

**Erwartetes Ergebnis:**
- Normale CPU-Speed

---

### 5.2 Performance Tracing

#### TEST-PERF-003: Record Trace
**Beschreibung:** Performance Trace aufzeichnen
**Schritte:**
1. `performance_start_trace` reload=true, autoStop=false
2. Navigiere/interagiere
3. `performance_stop_trace`

**Erwartetes Ergebnis:**
- Trace-Daten erfasst
- Core Web Vitals gemessen
- Performance Insights

---

#### TEST-PERF-004: Trace with Auto-Stop
**Beschreibung:** Trace automatisch nach Page Load
**Schritte:**
1. `performance_start_trace` reload=true, autoStop=true

**Erwartetes Ergebnis:**
- Trace startet
- Automatisch stoppt nach onLoad
- Insights verfügbar

---

#### TEST-PERF-005: Analyze Insights
**Beschreibung:** Spezifisches Insight analysieren
**Schritte:**
1. Trace aufnehmen
2. `performance_analyze_insight` insightName="LCPBreakdown"

**Erwartetes Ergebnis:**
- Detaillierte LCP-Analyse
- Breakdown von Timing-Phasen
- Verbesserungs-Vorschläge

**Test-Insights:**
- DocumentLatency
- LCPBreakdown
- RenderBlocking
- LayoutShift

---

## 6. Console & Debugging Tests

### 6.1 Console Messages

#### TEST-CON-001: List Console Messages
**Beschreibung:** Alle Console Logs auflesen
**Schritte:**
1. Navigate zu Seite mit console.log/error
2. `list_console_messages`

**Erwartetes Ergebnis:**
- Array mit Messages
- Types: log, warn, error, info
- Timestamps
- Stack Traces (bei Errors)

---

#### TEST-CON-002: Filter Console Errors
**Beschreibung:** Nur Errors auflisten
**Voraussetzungen:** Seite mit JS-Error

**Erwartetes Ergebnis:**
- Nur error-Type Messages
- Stack Trace vorhanden
- Line Numbers korrekt

---

### 6.2 Script Execution

#### TEST-SCRIPT-001: Evaluate Simple Script
**Beschreibung:** JavaScript in Page ausführen
**Schritte:**
1. `evaluate_script` function="() => { return document.title }"

**Erwartetes Ergebnis:**
- Return: Page Title als String
- Keine Fehler

---

#### TEST-SCRIPT-002: Evaluate with Arguments
**Beschreibung:** Script mit Element-Argument
**Schritte:**
1. `take_snapshot` für UID
2. `evaluate_script` mit:
   ```javascript
   function="(el) => { return el.innerText }"
   args=[{"uid": "button-uid"}]
   ```

**Erwartetes Ergebnis:**
- Return: Button-Text
- Element korrekt übergeben

---

#### TEST-SCRIPT-003: Async Script
**Beschreibung:** Async/Await in Script
**Schritte:**
1. `evaluate_script`:
   ```javascript
   async () => {
     await fetch('/api/data');
     return 'done';
   }
   ```

**Erwartetes Ergebnis:**
- Promise resolved
- Return value korrekt

---

#### TEST-SCRIPT-004: Script Error Handling
**Beschreibung:** Fehler in Script abfangen
**Schritte:**
1. `evaluate_script` mit ungültigem Code

**Erwartetes Ergebnis:**
- Error returned (nicht crash)
- Error Message klar
- Stack Trace

---

## 7. Dialog Handling Tests

#### TEST-DIALOG-001: Accept Alert
**Beschreibung:** JavaScript alert() akzeptieren
**Schritte:**
1. Trigger alert() auf Seite
2. `handle_dialog` action="accept"

**Erwartetes Ergebnis:**
- Alert geschlossen
- Seite reagiert

---

#### TEST-DIALOG-002: Dismiss Confirm
**Beschreibung:** Confirm-Dialog ablehnen
**Schritte:**
1. Trigger confirm()
2. `handle_dialog` action="dismiss"

**Erwartetes Ergebnis:**
- Dialog geschlossen
- Callback mit false

---

#### TEST-DIALOG-003: Prompt with Text
**Beschreibung:** Prompt mit Eingabe
**Schritte:**
1. Trigger prompt()
2. `handle_dialog` action="accept", promptText="Test Input"

**Erwartetes Ergebnis:**
- Prompt geschlossen
- Input-Text übergeben

---

## 8. Wait & Timing Tests

#### TEST-WAIT-001: Wait for Text
**Beschreibung:** Auf Text-Erscheinen warten
**Schritte:**
1. Navigate zu Seite mit delayed content
2. `wait_for` text="Loading complete"

**Erwartetes Ergebnis:**
- Wartet bis Text erscheint
- Timeout falls nicht erscheint

---

#### TEST-WAIT-002: Wait with Custom Timeout
**Beschreibung:** Spezifisches Timeout
**Schritte:**
1. `wait_for` text="Rare Text", timeout=5000

**Erwartetes Ergebnis:**
- Timeout nach 5s
- Error wenn nicht gefunden

---

## 9. Integration Tests

### 9.1 Full User Journey

#### TEST-INT-001: Login Flow
**Beschreibung:** Kompletter Login-Prozess
**Schritte:**
1. Navigate zu Login-Seite
2. Fill Username
3. Fill Password
4. Click Login Button
5. Wait for Dashboard
6. Take Screenshot

**Erwartetes Ergebnis:**
- Erfolgreicher Login
- Dashboard geladen
- Screenshot zeigt Dashboard

---

#### TEST-INT-002: Form Submission
**Beschreibung:** Formular ausfüllen und absenden
**Schritte:**
1. Navigate zu Form
2. `fill_form` mit allen Feldern
3. Click Submit
4. Wait for Success Message
5. Check Network Request

**Erwartetes Ergebnis:**
- POST Request abgeschickt
- Response 200
- Success Message erscheint

---

#### TEST-INT-003: E2E Shopping Cart
**Beschreibung:** Produkt kaufen
**Schritte:**
1. Search Product
2. Click Product
3. Add to Cart
4. Go to Checkout
5. Fill Shipping
6. Confirm Order

**Erwartetes Ergebnis:**
- Jeder Schritt erfolgreich
- Order Confirmation

---

## 10. Error Handling Tests

#### TEST-ERR-001: Network Timeout
**Beschreibung:** Page Load Timeout
**Schritte:**
1. `navigate_page` zu very slow URL, timeout=1000

**Erwartetes Ergebnis:**
- Timeout Error nach 1s
- Graceful Error Message

---

#### TEST-ERR-002: Element Not Found
**Beschreibung:** Interaktion mit nicht-existentem Element
**Schritte:**
1. `click` mit ungültigem UID

**Erwartetes Ergebnis:**
- Error: Element not found
- Keine Browser-Crash

---

#### TEST-ERR-003: Invalid Script
**Beschreibung:** Ungültiger JavaScript Code
**Schritte:**
1. `evaluate_script` mit Syntax-Error

**Erwartetes Ergebnis:**
- Syntax Error zurück
- Keine MCP-Crash

---

## 11. Performance Benchmarks

### Benchmark-Ziele

| Operation | Max Time | Notes |
|-----------|----------|-------|
| navigate_page | 30s | Standard timeout |
| take_snapshot | 2s | For average page |
| take_screenshot | 3s | Full page |
| click | 500ms | Simple click |
| fill_form | 1s | 5 fields |
| list_network_requests | 1s | <1000 requests |
| evaluate_script | 5s | Async allowed |

---

## 12. Regression Tests

### Critical Paths
1. **Page Management Stability**
   - Multiple page opens/closes
   - Keine Memory Leaks
   - Consistent indexing

2. **Network Capture Reliability**
   - Alle Requests erfasst
   - Keine Duplikate
   - Headers komplett

3. **Screenshot Quality**
   - Konsistente Dimensionen
   - Korrekte Farben
   - Keine Artefakte

4. **Form Interaction Stability**
   - Values korrekt gesetzt
   - Events gefeuert
   - Validation triggert

---

## Test-Ausführung

### Automatisierte Test-Suite
```bash
# Alle Tests ausführen
npm test

# Spezifische Kategorie
npm test -- --grep "Navigation"

# Mit Coverage
npm test -- --coverage
```

### Manuelles Testing
1. Chrome DevTools MCP Server starten
2. Test-Seite laden
3. Tests einzeln ausführen
4. Screenshots/Logs sammeln

### CI/CD Integration
- Tests bei jedem Commit
- Nightly Full-Suite Run
- Performance Regression Detection

---

## Test-Report Format

### Pro Test
- **Test-ID**: Eindeutige ID
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Skip
- **Execution Time**: ms
- **Error Message**: Falls Fail
- **Screenshots**: Bei visuellen Tests
- **Network Logs**: Bei Network Tests

### Summary Report
- Total Tests: X
- Passed: Y
- Failed: Z
- Duration: Xm Ys
- Coverage: X%

---

## Maintenance

### Test-Updates bei:
- Neue MCP Features
- Chrome-Updates
- Breaking Changes
- Bug Reports

### Review Schedule
- Wöchentlich: Failed Tests analysieren
- Monatlich: Test-Suite Review
- Quartal: Performance Baseline Update
