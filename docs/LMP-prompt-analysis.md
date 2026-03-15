# LMP: analýza a návrh promptu

## 1. Porovnání tvého návrhu se současným stavem

### Současný stav (kód)

- **worksheet-from-topic** a **worksheet-from-textbook**: pro LMP se mění jen jedna věta v `userPrompt`:
  - Topic: *„Tento výstup je pro ZÁKLADNÍ ŠKOLU PRO ŽÁKY S LMP (RVP ZV–LMP). JEDNODUCHÁ SLOVA, KRÁTKÉ VĚTY. Konkrétní a názorné úlohy, jeden krok na úlohu.“*
  - Textbook: *„Tento výstup je pro ZŠ PRO ŽÁKY S LMP (RVP ZV–LMP). JEDNODUCHÁ SLOVA, KRÁTKÉ VĚTY. Konkrétní úlohy.“*
- **Typy úloh:** Stejné `taskTypeCounts` jako u běžné ZŠ – uživatel může zvolit libovolnou kombinaci (včetně mnoha `short_answer`, `reading_questions`). Žádná preference ani omezení.
- **System instruction:** Stejná pro basic i LMP; žádné LMP-specifické pravidlo (kognitivní úroveň, délka otázky, zákaz abstrakce, preferované typy).
- **Popisy typů úloh** (`TASK_TYPE_LINES`): Jedny pro všechny; pro LMP není upřesněno „fill_in jen jedno slovo“, „short_answer maximálně jedna krátká věta“ atd.

### Tvůj návrh oproti tomu přidává

| Oblast | Současný stav | Tvůj návrh |
|--------|----------------|------------|
| Jazyk | „Jednoduchá slova, krátké věty“ | Velmi jednoduchý jazyk, krátké věty, jedna otázka = jedna informace, žádná složitá souvětí, žádné abstraktní pojmy |
| Kognice | Není | Náročnost cca o 1–2 ročníky níže, méně abstrakce, méně analytiky |
| Typy úloh | Všechny stejně přípustné | Preferovat MC, P/N, fill_in (1 slovo/rok), draw_picture; omezit/vynechat dlouhé short_answer, složité reading_questions, „vysvětli proč“, porovnávání, abstrakci |
| Formulace | Není | Max 8–10 slov na otázku, jedna myšlenka, stručné jednoznačné odpovědi, fill_in jen jedno slovo nebo rok |
| Rámec | RVP ZV–LMP zmíněn | Téma, předmět a ročník zůstávají; výstup přizpůsoben možnostem žáka s LMP |

**Závěr porovnání:** Současný prompt LMP fakticky říká jen „stejný pracovní list, ale jednodušší čeština a konkrétní úlohy“. Nerozlišuje LMP jako **samostatný pedagogický režim** (úprava náročnosti, typů úloh a formulací). Tvůj návrh to výrazně mění.

---

## 2. Zhodnocení: odpovídá současný prompt potřebám žáků s LMP?

**Ne.** Důvody:

- **Kognitivní úroveň** – Není zmíněna. Model může generovat úlohy na úrovni běžného ročníku (analýza, „vysvětli“, porovnej).
- **Typy úloh** – Učitel může zadat např. 5× reading_questions a 3× short_answer; model je vyplní bez pokynu, že u LMP mají být výjimkou a velmi jednoduché.
- **Délka a struktura** – Chybí omezení délky (8–10 slov), pravidlo „jedna otázka = jedna informace“ a zákaz složitých souvětí/abstraktních pojmů.
- **Fill_in / short_answer** – V obecném popisu je „1–2 věty“ u short_answer a „jedno slovo nebo rok“ u fill_in, ale pro LMP není zdůrazněno „u LMP vždy jen jedno slovo / jedna velmi krátká odpověď“.

Současný přístup je tedy v praxi **spíš jazykově a stylově zjednodušená verze běžného listu**, ne cílená úprava pro LMP (kognice + typy + formulace).

---

## 3. Návrh lepšího promptu a struktury pro Gemini 2.5 Flash Lite

Cíl: jeden kompaktní blok pro LMP (system nebo user), který je **stabilní, šetrný na tokeny** a **pedagogicky konzistentní**.

### 3.1 Kde LMP pravidla umístit

- **System instruction:** Přidat LMP-specifický odstavec **pouze pokud `schoolType === "lmp"`**. Výhoda: model má „roli“ hned na začátku.
- **User prompt:** Jedna sada instrukcí pro LMP (účel, jazyk, kognice, typy, formulace) – buď v useru, nebo v systemu; doporučuji **system** (jednou, přehledně), v useru jen „Předmět, ročník, téma, počty úloh“.

### 3.2 Navržený LMP blok (system instruction)

Krátká, bodová forma, aby byl výstup předvídatelný a tokenově úsporný:

```
Tento pracovní list je pro žáky s lehkým mentálním postižením (LMP).
- Jazyk: velmi jednoduchý, krátké věty. Jedna otázka = jedna informace. Max cca 8–10 slov na otázku. Žádná složitá souvětí ani abstraktní pojmy.
- Kognitivní úroveň: přizpůsob náročnost zhruba o 1–2 ročníky níže než běžná ZŠ; stále v rámci zadaného tématu. Méně analýzy a „vysvětli proč“, více rozpoznání a jednoduchého doplnění.
- Preferované typy: multiple_choice, true_false, fill_in (jen jedno slovo nebo rok), jednoduché draw_picture. U short_answer a reading_questions: pouze velmi jednoduché, konkrétní otázky a stručné odpovědi (1 krátká věta).
- Formulace: konkrétní otázky, ne abstraktní. Možnosti u výběru krátké a jasné. Odpovědi stručné a jednoznačné.
```

### 3.3 Popisy typů úloh pro LMP

Pro **stabilitu a levné tokeny** doporučuji:

- V **backendu** při `isLmp === true` volat jinou funkci než `getTaskTypeLinesForPrompt(taskTypeCounts)` – např. `getTaskTypeLinesForLmp(taskTypeCounts)`, která:
  - pro `multiple_choice`, `true_false`, `fill_in`, `draw_picture` použije **LMP-specifické** krátké popisy (např. „multiple_choice: 3–4 krátké možnosti, jednoduchý jazyk“),
  - pro `short_answer` a `reading_questions` přidá dodatek: „pro LMP: pouze jedna velmi krátká konkrétní otázka, odpověď max 1 věta“.

Tím zůstane jeden zdroj pravdy v kódu a prompt nebude přetékát opakováním.

---

## 4. Omezit některé typy úloh pro LMP na úrovni backendu?

**Dvě rozumné varianty:**

### Varianta A: Měkké omezení (pouze prompt)

- Backend **nemění** `taskTypeCounts`; uživatel může zvolit libovolné typy.
- V promptu je explicitně: „U short_answer a reading_questions generuj pouze velmi jednoduché úlohy (jedna myšlenka, max 1 věta odpověď). Preferuj u LMP výběr a doplňování.“
- **Výhoda:** Flexibilita; učitel může občas zařadit jednu jednoduchou „otázku k textu“. **Nevýhoda:** Model občas může vygenerovat složitější open question.

### Varianta B: Tvrdé omezení (backend)

- Při `schoolType === "lmp"` **před voláním modelu** upravit `taskTypeCounts`:
  - např. `short_answer` a `reading_questions` **nastavit na 0** a jejich počet **převést** do `multiple_choice` nebo `fill_in` (nebo rozdělit podle konvence),
  - nebo jednoduše **vynulovat** short_answer a reading_questions a nechat celkový počet úloh nižší (uživatel uvidí méně úloh).
- **Výhoda:** Maximálně předvídatelné výstupy, žádné složité open questions. **Nevýhoda:** Učitel nemůže oficiálně „zažádat“ o reading_questions; pokud to chce, musel by zvolit běžnou ZŠ a přizpůsobit sám.

**Doporučení:** Začít **Variantou A** (měkké omezení v promptu + LMP-specifické popisy typů). Pokud po testování zjistíš, že model u LMP stále často generuje příliš náročné short_answer/reading_questions, zavedení **Varianty B** (vynulování nebo přesun těchto typů v backendu) je rozumný další krok.

---

## 5. Jak nastavit prompt: pedagogicky správný, stabilní, levný na tokeny

- **Pedagogicky správný:**  
  - V system (nebo user) bloku pro LMP mít výslovně: cíl (LMP), jazyk (jednoduchý, krátké věty, jedna informace, max 8–10 slov), kognice (1–2 ročníky níže, méně analýzy), preferované/omezené typy úloh, zákaz abstrakce a složitých formulací.  
  - Popisy typů úloh pro LMP zohlednit (fill_in = jedno slovo/rok; short_answer/reading_questions = výjimka, jen velmi jednoduché).

- **Stabilní:**  
  - Jedna pevná sada vět pro LMP (jako výše), bez dlouhého opakování.  
  - Používat stejný LMP blok pro topic i textbook; u textbooku jen doplnit „úlohy vycházejí z přiloženého textu“.

- **Levný na tokeny:**  
  - LMP blok cca 120–150 tokenů (odstavce výše).  
  - LMP-specifické řádky u typů úloh přidat jen pro ty typy, které mají count > 0 (stejná logika jako `getTaskTypeLinesForPrompt`).  
  - Nepřidávat dlouhé příklady; stačí bodové instrukce.

---

## Shrnutí odpovědí na tvé body

1. **Porovnání:** Současný stav = jedna věta o LMP (jednoduchá slova, krátké věty, konkrétní úlohy). Tvůj návrh přidává kognici, preferované/omezené typy úloh, pravidla formulace a rámec (téma/ročník beze změny, náročnost níže).
2. **Současný prompt:** Neodpovídá plně potřebám LMP; jde spíš o jazykově zjednodušenou verzi běžného listu.
3. **Lepší prompt:** LMP blok do system instruction + LMP-specifické popisy typů úloh (volitelně samostatná funkce `getTaskTypeLinesForLmp`).
4. **Omezit typy na backendu:** Doporučuji nejdřív měkké omezení v promptu; pokud to nebude stačit, zavést v backendu vynulování nebo přesun short_answer/reading_questions pro LMP.
5. **Nastavení:** Pedagogicky – výslovný LMP blok a upravené popisy typů; stabilita – jedna sdílená sada pravidel; tokeny – krátké body, bez zbytečných příkladů.

---

## Návrh konkrétního znění pro implementaci

Níže je text, který lze vložit do kódu jako LMP system přírůstek nebo jako druhý blok v user promptu (podle toho, zda dáte LMP do system nebo user).

**Text LMP bloku (pro system instruction při `isLmp`):**

```
Tento pracovní list je pro žáky s lehkým mentálním postižením (LMP).
Jazyk: velmi jednoduchý, krátké věty. Jedna otázka = jedna informace. Max cca 8–10 slov na otázku. Žádná složitá souvětí ani abstraktní pojmy.
Kognitivní úroveň: náročnost zhruba o 1–2 ročníky níže než běžná ZŠ, stále v rámci tématu. Méně analýzy a „vysvětli proč“, více rozpoznání a jednoduchého doplnění.
Preferované typy: multiple_choice, true_false, fill_in (jen jedno slovo nebo rok), draw_picture. U short_answer a reading_questions jen velmi jednoduché konkrétní otázky, odpověď max 1 věta.
Formulace: konkrétní otázky; možnosti u výběru krátké; odpovědi stručné a jednoznačné.
```

Pokud budeš chtít, můžu tento blok a volání `getTaskTypeLinesForLmp` zapracovat přímo do `worksheet-from-topic` a `worksheet-from-textbook` (system + popisy typů).
