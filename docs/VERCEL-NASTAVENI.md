# Nastavení projektu na Vercelu – krok za krokem

Tento návod popisuje, co nastavit na Vercelu, aby aplikace **Generátor pracovních listů** na produkci fungovala (generování, beta přístup, statistiky).

---

## 1. Přihlášení a výběr projektu

1. Otevři v prohlížeči **https://vercel.com** a přihlas se.
2. V dashboardu vyber projekt **pracovni-listy** (nebo název tvého projektu).
3. Klikni na název projektu – otevře se přehled (Deployments, Settings, …).

---

## 2. Proměnné prostředí (Environment Variables)

1. V levém menu projektu klikni na **Settings**.
2. V horním menu vyber **Environment Variables**.
3. Přidej nebo zkontroluj následující proměnné. U každé zvol **Environment(s)**:
   - zaškrtni **Production** (povinné pro produkci),
   - volitelně **Preview** (pro náhledové deploye) a **Preview** (pro testování).

### 2.1 GEMINI_API_KEY (povinné pro generování)

| Pole | Hodnota |
|-----|--------|
| **Name** | `GEMINI_API_KEY` |
| **Value** | Tvůj API klíč z Google AI Studio (začíná např. `AIza...`) |
| **Environments** | Production (a volitelně Preview) |

**Kde získat klíč:**
- Otevři **https://aistudio.google.com/apikey**
- Přihlas se Google účtem
- Klikni na **Create API key** (nebo **Get API key**)
- Zkopíruj klíč a vlož ho do Value (bez mezer na začátku/konci)

Bez tohoto klíče se pracovní listy na Vercelu negenerují (zobrazí se chyba).

---

### 2.2 BETA_CODES (povinné pro beta přístup)

| Pole | Hodnota |
|-----|--------|
| **Name** | `BETA_CODES` |
| **Value** | Seznam beta kódů oddělených čárkou, bez mezer. Příklad: `beta-pl-001,beta-pl-002,beta-pl-003` |
| **Environments** | Production (a volitelně Preview) |

**Příklad:**  
`beta-pl-001,beta-pl-002,beta-pl-003,beta-pl-004,beta-pl-005,beta-pl-006,beta-pl-007,beta-pl-008,beta-pl-009,beta-pl-010`

Uživatelé pak na stránce `/beta` zadají jeden z těchto kódů a získají přístup. Bez BETA_CODES nebude beta přístup fungovat (API vrátí chybu).

---

### 2.3 Redis (statistiky) – přidá se přes Storage

Proměnné **UPSTASH_REDIS_REST_URL** a **UPSTASH_REDIS_REST_TOKEN** **nepřidávej ručně**. Vercel je doplní sám, až k projektu připojíš úložiště Redis (viz krok 3). Po připojení je uvidíš v seznamu Environment Variables.

---

## 3. Připojení Redis (statistiky na Vercelu)

Bez Redis se na Vercelu statistiky neukládají (všechny záznamy zůstanou 0). Redis přidáš takto:

1. V projektu na Vercelu v levém menu klikni na **Storage** (nebo **Integrations** / **Marketplace** – záleží na verzi rozhraní).
2. Klikni na **Create Database** nebo **Connect Store**.
3. Vyber **Upstash** (nebo v Marketplace vyhledej „Upstash“).
4. Z nabízených produktů Upstash vyber **Upstash for Redis** („Serverless DB – Redis“).
5. Postupuj podle průvodce:
   - přihlášení / autorizace Upstash (pokud je potřeba),
   - vytvoření nové Redis databáze (název např. `pracovni-listy-redis`),
   - výběr regionu (můžeš nechat výchozí).
6. Po vytvoření databáze Vercel nabídne **připojení k projektu**. Vyber projekt **pracovni-listy** a potvrď (Connect / Připojit).
7. Zvol **Environments**: zaškrtni **Production** (a volitelně Preview, Development).
8. **Custom prefix** ponech prázdný (nebo výchozí), aby se vytvořily proměnné `UPSTASH_REDIS_REST_URL` a `UPSTASH_REDIS_REST_TOKEN`.
9. Klikni na **Connect** (Připojit).

Po dokončení se v **Settings → Environment Variables** objeví automaticky přidané proměnné od Upstash. Není potřeba je opisovat ručně.

---

## 4. Aplikace změn (nový deploy)

Změny proměnných prostředí se projeví až u **dalšího** deploye.

1. V menu projektu klikni na **Deployments**.
2. U posledního deploye klikni na tři tečky (**⋯**) → **Redeploy**.
3. Potvrď **Redeploy** (můžeš nechat zaškrtnuté „Use existing Build Cache“).
4. Počkej, až deploy doběhne (status „Ready“).

Alternativa: stačí udělat nový push do repozitáře (např. na `main`) – Vercel spustí deploy sám.

---

## 5. Kontrola, že vše běží

1. **Beta přístup:** Otevři `https://tvoje-domena.vercel.app/beta`, zadej jeden z kódů z BETA_CODES a klikni Vstoupit. Měl bys skončit na úvodní stránce.
2. **Generování:** Přihlas se (beta kód), vytvoř pracovní list (z tématu nebo z učebnice). List by se měl vygenerovat (bez chyby o API klíči).
3. **Statistiky:** Přihlas se kódem **beta-pl-001**, v menu klikni na **Statistiky** (nebo otevři `/analytics`). Měl bys vidět tabulky; po vygenerování listu by se měla čísla zvýšit (pokud je Redis připojený).

---

## Shrnutí – co musí být na Vercelu nastavené

| Co | Kde / jak |
|----|-----------|
| **GEMINI_API_KEY** | Settings → Environment Variables (ručně) |
| **BETA_CODES** | Settings → Environment Variables (ručně) |
| **UPSTASH_REDIS_REST_URL** | Přidá se automaticky po připojení Upstash Redis (Storage) |
| **UPSTASH_REDIS_REST_TOKEN** | Přidá se automaticky po připojení Upstash Redis (Storage) |
| **Nový deploy** | Po změně env spusť Redeploy nebo push do repa |

Pokud něco z toho chybí, generování, beta přístup nebo statistiky na Vercelu nebudou fungovat podle očekávání.
