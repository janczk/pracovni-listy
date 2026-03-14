# Worksheet Generator

Generátor pracovních listů (z tématu nebo z učebnice).

## Jak spustit projekt (krok za krokem)

1. Spusťte **Cursor**.
2. **File → Open Folder…** → vyberte složku `worksheet-generator` (cesta např. `/Users/macbookkucerik/worksheet-generator`).
3. V Cursoru otevřete **terminál** (Terminal → New Terminal) a napište:
   ```bash
   npm run dev
   ```
4. V prohlížeči otevřete **http://localhost:3000** (nebo port, který terminál ukáže – 3001, 3002, pokud 3000 je obsazen).

Žádné jedno „kliknutí na ikonu“ projekt nespustí – vždy je potřeba: otevřít složku v Cursoru, v terminálu spustit `npm run dev`, pak otevřít prohlížeč na localhost.

## Skripty

- `npm run dev` – vývojový server
- `npm run build` – produkční build
- `npm run start` – spuštění produkčního serveru
- `npm run lint` – kontrola kódu

## Nasazení na Vercel a statistiky

Na Vercelu nemá aplikace zapisovatelný souborový systém, proto se statistiky (počty vygenerovaných listů) ukládají do **Upstash Redis**.

- **Lokálně:** statistiky se ukládají do souboru `data/usage-stats.json`.
- **Na Vercelu:** přidejte v projektu integraci **Upstash Redis** (Vercel Marketplace → Redis). Vercel nastaví `UPSTASH_REDIS_REST_URL` a `UPSTASH_REDIS_REST_TOKEN`; při jejich přítomnosti aplikace ukládá statistiky do Redis a na Vercelu se trvale uchovají.
