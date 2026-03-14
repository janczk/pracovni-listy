# Simulace: cena jednoho pracovního listu (Fotosyntéza + SVP verze)

## Scénář

- **Typ školy:** Běžná ZŠ  
- **Téma:** Fotosyntéza  
- **Úlohy:** 3× Doplňování, 3× Výběr z možností, 3× Pravda/Nepravda, 2× Krátká odpověď, 1× Otázky k textu, 1× Nakresli obrázek (**celkem 13 úloh**)  
- **Přidat verzi pro SVP:** Ano  

→ Dvě volání API: (1) `worksheet-from-topic`, (2) `worksheet-simplify-for-svp`.

---

## Ceník Gemini 2.5 Flash (orientačně)

| | Cena za 1 M tokenů |
|---|-------------------|
| **Input**  | 0,30 USD |
| **Output** | 2,50 USD |

*(Zdroj: veřejné ceníky Google AI, 2025.)*

---

## 1. Volání: worksheet-from-topic (generování listu)

### Input (prompt)

Složení: systémová instrukce + téma „Fotosyntéza“ + `taskTypeCounts` + pravidla.

Příklad délky promptu (bez uvozovek):

- Úvod + téma + předmět/ročník/jazyk/účel/obtížnost: ~180 znaků  
- Instrukce pro běžnou ZŠ: ~120 znaků  
- Pravidla a typy úloh: ~1 100 znaků  
- `taskTypeCounts`: `{"multiple_choice":3,"true_false":3,"short_answer":2,"fill_in":3,"reading_questions":1,"draw_picture":1}` → ~90 znaků  
- Celkem odhad: **~1 500 znaků**

Pro češtinu/JSON: **1 token ≈ 3 znaky** → **input ≈ 500 tokenů**.  
Pro jistotu zaokrouhlíme nahoru: **input = 550 tokenů**.

### Output (JSON s 13 úlohami)

Odhad délky odpovědi (realistický český obsah):

| Typ úlohy        | Počet | Odhad znaků na úlohu (question + options + answer + explanation) | Celkem znaků |
|------------------|-------|-------------------------------------------------------------------|--------------|
| fill_in          | 3     | ~280                                                              | 840          |
| multiple_choice  | 3     | ~450                                                              | 1 350        |
| true_false       | 3     | ~320                                                              | 960          |
| short_answer     | 2     | ~380                                                              | 760          |
| reading_questions| 1     | ~380                                                              | 380          |
| draw_picture     | 1     | ~200                                                              | 200          |
| **JSON struktura**| –    | klíče, čárky, závorky                                             | ~400         |
| **Celkem**       |       |                                                                   | **~4 890**   |

Tokeny: 4 890 ÷ 3 ≈ **1 630 tokenů**. S rezervou (delší vysvětlení, formátování): **output = 2 000 tokenů**.

---

## 2. Volání: worksheet-simplify-for-svp (SVP verze)

### Input (instrukce + běžný list)

- Instrukce (pravidla pro zjednodušení): ~1 000 znaků  
- Serializace 13 úloh (otázka + možnosti + odpověď) v plain textu: ~3 500 znaků  
- **Celkem ~4 500 znaků** → 4 500 ÷ 3 ≈ **1 500 tokenů**. Zaokrouhleno: **input = 1 600 tokenů**.

### Output (JSON se 13 zjednodušenými úlohami)

Struktura stejná jako u běžného listu, texty kratší/jednodušší. Odhad: **~4 200 znaků** → **output ≈ 1 900 tokenů**. Zaokrouhleno: **output = 1 900 tokenů**.

---

## Souhrn tokenů na jeden „list (Fotosyntéza) + SVP“

| Volání              | Input (tokeny) | Output (tokeny) |
|---------------------|----------------|-----------------|
| from-topic          | 550            | 2 000           |
| simplify-for-svp    | 1 600          | 1 900           |
| **Celkem**          | **2 150**      | **3 900**       |

---

## Cena v USD

- **Input:**  2 150 × (0,30 / 1 000 000) = **0,000 645 USD**  
- **Output:** 3 900 × (2,50 / 1 000 000) = **0,009 75 USD**  
- **Celkem:** **≈ 0,010 4 USD** na jeden pracovní list (běžná verze + SVP verze).

---

## Cena v CZK (přepočet)

Při kurzu např. **1 USD = 23 Kč**:

- **0,010 4 × 23 ≈ 0,24 Kč** (cca **čtvrt koruny** na jeden list včetně SVP verze).

Při kurzu **1 USD = 25 Kč**: **≈ 0,26 Kč**.

---

## Závěr simulace

| Položka                         | Hodnota        |
|---------------------------------|----------------|
| Počet volání API                | 2              |
| Input tokeny                    | ~2 150         |
| Output tokeny                   | ~3 900         |
| **Cena za 1 list (USD)**       | **~0,010 4**   |
| **Cena za 1 list (CZK, 23 Kč)**| **~0,24 Kč**   |

Tj. **řádově pod 1 Kč** na jeden takto vygenerovaný pracovní list (Fotosyntéza, 13 úloh, včetně SVP verze).  
Při 2,1 M output tokenech za den vychází z této simulace ekvivalent **cca 2 100 000 ÷ 3 900 ≈ 538** takových listů za den (pokud by všechna volání měla stejný profil).
