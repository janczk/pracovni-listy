# Rollback: změna Typ školy ze SVP na LMP

Tento soubor popisuje všechny změny provedené při nahrazení „Základní škola pro žáky s SVP“ typem „Základní škola pro žáky s lehkým mentálním postižením (LMP)“ v dropdownu Typ školy. Pokud bude potřeba vrátit zpět na SVP, lze podle tohoto návodu změny zvrátit.

## Shrnutí změn

- **Typ školy (dropdown):** druhá volba je nyní „Základní škola pro žáky s lehkým mentálním postižením (LMP)“ s hodnotou `lmp`. Při výběru LMP se generuje pracovní list přímo pro žáky s LMP (upravený prompt), ukládá se jedna verze.
- **Přidat verzi pro SVP + velkým písmenem:** beze změny textu; zobrazují se **pouze** když je vybraná „Základní škola“ (basic). Pro LMP se tyto volby nezobrazují.
- **Prompt pro LLM:** při `schoolType === "lmp"` se používá nový blok instrukcí přizpůsobený žákům s LMP (jednoduchý jazyk, krátké věty, konkrétní úlohy, tempo a možnosti LMP).

## Soubory a konkrétní úpravy

### 1. Typy

- **`src/types/inputs.ts`**  
  - `SchoolType`: změněno z `"basic" | "svp"` na `"basic" | "lmp"` (dropdown už neposílá `svp`).

- **`src/types/worksheet.ts`**  
  - `SchoolType`: změněno z `"basic" | "svp"` na `"basic" | "svp" | "lmp"` (uložený list může být basic, svp [zjednodušená verze], nebo lmp).

### 2. České popisky

- **`src/lib/czech.ts`**  
  - `SCHOOL_TYPES`: druhý prvek změněn z `{ value: "svp", label: "Základní škola pro žáky s SVP" }` na `{ value: "lmp", label: "Základní škola pro žáky s lehkým mentálním postižením (LMP)" }`. Typ pole: `"basic" | "lmp"`.
  - `SCHOOL_TYPE_LABELS`: přidán klíč `lmp` s popiskem pro LMP; `svp` ponechán pro zobrazení zjednodušené verze (např. „Zjednodušená verze (SVP)“).

### 3. API – prompt pro LLM

- **`src/app/api/worksheet-from-topic/route.ts`**  
  - `audienceInstruction`: místo jedné konstanty se volí podle `body.schoolType`.  
  - Pro `body.schoolType === "lmp"`: použit LMP blok (škola pro žáky s LMP, jednoduchá slova, krátké věty, méně abstrakce, jasné instrukce, přiměřené tempu a možnostem žáků s LMP).  
  - Pro `body.schoolType !== "lmp"`: ponechán stávající text pro běžnou ZŠ.

- **`src/app/api/worksheet-from-textbook/route.ts`**  
  - Stejná logika výběru `audienceInstruction` podle `body.schoolType` (LMP vs. běžná ZŠ).

### 4. Formuláře a ukládání

- **`src/app/create-from-topic/page.tsx`**  
  - Podmínka pro ukládání: místo `input.schoolType === "svp"` použito `input.schoolType === "lmp"`. Při LMP se ukládá pouze vygenerovaný list (žádné volání SVP simplify).  
  - Zobrazení checkboxů „Přidat verzi pracovního listu pro žáky s SVP“ a „Pracovní list velkým písmenem“: pouze když `input.schoolType === "basic"` (ne když je LMP).

- **`src/app/create-from-textbook/page.tsx`**  
  - Zobrazení stejných dvou checkboxů pouze když `schoolType === "basic"`.  
  - Při `schoolType === "lmp"` se volá API s LMP promptem a ukládá se jedna verze (bez SVP simplify).  
  - (Pokud byl dříve speciální kód pro `schoolType === "svp"`, byl nahrazen/odstraněn ve prospěch LMP.)

### 5. Result page a další

- **`src/app/result/page.tsx`**  
  - Používá `SCHOOL_TYPE_LABELS`; po přidání `lmp` a ponechání `svp` zobrazí správné názvy pro uložené listy (basic, svp, lmp).
  - Při „Regenerovat celý list“ se pro API sestavuje `TopicInput` s `schoolType` pouze `"basic" | "lmp"`: pokud je uložený list zjednodušená verze (`schoolType === "svp"`), do API se pošle `schoolType: "basic"`.

- **`src/app/api/worksheet-simplify-for-svp/route.ts`**  
  - Beze změny: zjednodušená verze dál dostává `schoolType: "svp"` (pro „Přidat verzi pro SVP“).

---

## Jak vrátit zpět na SVP (rollback)

1. **Typy:** V `inputs.ts` změnit `SchoolType` zpět na `"basic" | "svp"`. V `worksheet.ts` změnit na `"basic" | "svp"` (odstranit `lmp`).
2. **czech.ts:** V `SCHOOL_TYPES` vrátit druhý prvek na `{ value: "svp", label: "Základní škola pro žáky s SVP" }`. V `SCHOOL_TYPE_LABELS` odstranit `lmp`, ponechat jen `basic` a `svp`.
3. **API:** V obou route (from-topic, from-textbook) odstranit větvení pro LMP a používat jednu `audienceInstruction` pro běžnou ZŠ; podmínku `body.schoolType === "lmp"` odstranit (popř. znovu zavést jednoduchou větev pro `svp` jako dříve, pokud byla).
4. **create-from-topic:** V podmínce ukládání vrátit `input.schoolType === "svp"` a znovu volat SVP simplify při výběru SVP. Zobrazení checkboxů vrátit na `(input.schoolType === "svp" || input.simplifiedVersion)` (nebo původní logiku).
5. **create-from-textbook:** Stejně – vrátit použití `svp` a zobrazení checkboxů podle původní logiky.

Po rollbacku smaž nebo uprav tento soubor podle potřeby.
