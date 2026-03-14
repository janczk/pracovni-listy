# Analýza spotřeby tokenů Gemini 2.5 Flash (24 h)

## Zadaná data (24 h)

| Typ | Počet tokenů |
|-----|--------------|
| **Output** | 2 095 645 |
| **Input**  | 375 345     |

Poměr output/input ≈ **5,58** (model „píše“ výrazně víc, než dostane – typické pro generování listů).

---

## Kde aplikace volá Gemini

1. **`/api/worksheet-from-topic`** – vygenerování celého pracovního listu z tématu  
2. **`/api/worksheet-from-textbook`** – vygenerování listu z nahraného textu (až 6000 znaků)  
3. **`/api/worksheet-simplify-for-svp`** – zjednodušení existujícího listu pro SVP  
4. **`/api/worksheet-regenerate-task`** – přegenerování jedné úlohy  

Žádné další volání Gemini v kódu nejsou (kromě volitelného testu v `geminiClient`).

---

## Odhad tokenů na jedno volání

Odhad vychází z délky promptů a typické délky JSON odpovědi (český text; zjednodušeně **≈ 1 token ≈ 3 znaky**).

| Endpoint | Input (odhad) | Output (odhad) |
|---------|----------------|----------------|
| **worksheet-from-topic**   | ~900  | ~3 500–5 000 |
| **worksheet-from-textbook**| ~2 800| ~3 500–5 000 |
| **worksheet-simplify-for-svp** | ~1 500–2 500 | ~3 500–5 000 |
| **worksheet-regenerate-task**  | ~500  | ~200–400    |

- **Jeden „celý list“** (from-topic nebo from-textbook): typicky **~4 000 output tokenů**.  
- **List + SVP verze** (from-topic + simplify): **~4 000 + ~4 000 = ~8 000 output tokenů**.  
- **Regenerace jedné úlohy**: **~300 output tokenů**.

---

## Kolika pracovním listům to může odpovídat?

### Podle output tokenů

- Pouze **generování nových listů** (from-topic / from-textbook), každý ~4 000 out:
  - **2 095 645 ÷ 4 000 ≈ 524** listů.
- Pokud by **polovina** listů měla i **SVP verzi** (list + simplify = 8 000 out):
  - **2 095 645 ÷ 8 000 ≈ 262** listů (každý s jednou SVP verzí).
- Smíšený režim (část jen list, část list+SVP, část regenerate):
  - **250–500 ekvivalentů „listů“** (podle toho, kolik je SVP a kolik regenerací).

### Podle input tokenů

- **375 345** input tokenů:
  - Kdyby šlo jen **from-topic** (~900 in/list): **375 345 ÷ 900 ≈ 417** volání.
  - Kdyby šlo jen **from-textbook** (~2 800 in/list): **375 345 ÷ 2 800 ≈ 134** volání.
  - Reálně mix → počet volání mezi těmito čísly, podle podílu „z tématu“ vs „z učebnice“.

### Konzervativní a horní odhad

| Scénář | Ekvivalentní počet |
|--------|---------------------|
| **Nízký odhad** (hodně SVP, část z učebnice, nějaké regenerace) | **~200–250** pracovních listů |
| **Střední odhad** (mix jako výše) | **~300–400** pracovních listů |
| **Vysoký odhad** (téměř jen from-topic, málo SVP) | **~450–520** pracovních listů |

Za **24 hodin** to znamená řádově **~8–22 listů za hodinu** (podle scénáře), tedy při souvislém testování nebo více uživatelích toto číslo dává smysl.

---

## Co může spotřebu zvyšovat

1. **Opakované generování** – uživatel mění parametry a znovu klikne „Vygenerovat“ (každé = nové volání).  
2. **SVP verze** – za každý list se SVP volá ještě `simplify-for-svp` → téměř **dvojnásobný output** na jeden list.  
3. **Regenerace úloh** – každé „Generovat“ u jedné úlohy = malé volání; při větším počtu úloh a úpravách se nasčítají.  
4. **Z učebnice** – větší input (až 6000 znaků textu) zvyšuje hlavně **input** tokeny.  
5. **Chyby a opakované pokusy** – při pádu nebo nevalidní odpovědi může klient znovu poslat požadavek.  
6. **Více uživatelů / beta testerů** – 10 lidí × 30 listů = 300 listů za den je v řádu „středního“ odhadu.

---

## Shrnutí

- **2,1 M output a 375 k input** za 24 h jsou **řádově 250–500 „pracovních listů“** (nebo ekvivalentů: list + SVP + regenerace).
- To není nutně chyba – odpovídá to intenzivnímu používání (více uživatelů, testování, opakované generování a SVP verze).
- Pokud očekáváte výrazně menší počet uživatelů nebo listů, má smysl zkontrolovat:
  - zda se někde nevolá API v smyčce nebo při každém renderu,
  - zda beta testeri neposílají nadbytečné požadavky (např. opakované klikání na „Vygenerovat“).
