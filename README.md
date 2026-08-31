# udir-fuseki-test

Verktøy for å sammenligne dagens SPARQL-endepunkt (GraphDB på
`sparql-data.udir.no`) med det nye Jena Fuseki-oppsettet i Azure Container
Apps, før overgangen.

Lim inn en vanlig (ikke URL-enkodet) SPARQL-spørring, trykk **Run**, og få:

- **Responstid** – total tid og time-to-first-byte, som min / median / p95
  over N iterasjoner.
- **Kaldstart** – første kall måles separat. Fuseki kjører med scale-to-zero
  i Azure Container Apps, så første kall etter inaktivitet kan ta titalls
  sekunder.
- **Respons-diff** – semantisk, ikke tekst-diff: `head.vars` sammenlignes som
  mengde, `results.bindings` som multiset (radrekkefølge er ikke signifikant
  uten `ORDER BY`). ASK sammenligner boolean-verdien.
- De rå responsene fra begge endepunkter.

Spørringen sendes alltid som POST med `application/x-www-form-urlencoded`
(`query=…`) og `Accept: application/sparql-results+json`. URL-enkodingen skjer
i verktøyet – du lagrer og limer inn ren SPARQL.

## Lagrede spørringer

Én `.rq`-fil per spørring i `queries/`, ren (ikke-enkodet) SPARQL. Rediger dem
i editoren eller via UI-et (**Lagre som** / **Slett**). De er med i git, så et
delt sett følger repoet.

Lagringen har to backends (`lib/store.ts`):

- **Lokalt** (`npm run dev`): skriver/leser `queries/*.rq` direkte.
- **Vercel**: filsystemet er skrivebeskyttet, så lagring krever en **Blob-store**
  (env-var `BLOB_READ_WRITE_TOKEN`). Da lagres nye spørringer i Blob under
  `queries/<navn>.rq`, og `listQueries()` slår sammen de committede `.rq`-filene
  (skrivebeskyttet basis) med de Blob-lagrede (som overstyrer ved navnekollisjon).
  Innebygde (committede) spørringer kan ikke slettes via UI-et.

Uten Blob-token på Vercel gir «Lagre» en tydelig feilmelding i stedet for å krasje.

### Sette opp Blob

1. Vercel-prosjekt → **Storage** → **Create** → **Blob**. Koble den til prosjektet
   – da injiseres `BLOB_READ_WRITE_TOKEN` i alle miljøer automatisk.
2. Redeploy. `@vercel/blob` er allerede en avhengighet.
3. Lokalt (valgfritt): legg `BLOB_READ_WRITE_TOKEN=…` i `.env.local` for å teste
   Blob-stien; ellers brukes lokale filer.

## Batch og rapporter

**Kjør alle lagrede** kjører hver spørring mot begge endepunkter og lagrer en
rapport (`data/reports/<id>.json` lokalt, eller Blob under `reports/<id>.json` på
Vercel). Rapportene vises på `/report` – median-tider, `test/dagens`-forhold,
kaldstart og diff-status per spørring. `data/` er git-ignorert; del én lokal
rapport med `git add -f data/reports/<id>.json`. Uten Blob på Vercel kjøres
batchen fortsatt, men rapporten lagres ikke (UI-et sier fra).

## Last-modus

Kryss av for **Last-modus** for å fyre iterasjonene fra en pool av N samtidige
kall i stedet for sekvensielt. Da rapporteres også gjennomstrømning (req/s) og
feilrate per endepunkt. Uten last-modus kjøres kallene interleaved
(dagens, test, dagens, test …) så nettverksdrift treffer begge likt.

## Kjøre lokalt

```bash
npm install
npm run dev
# http://localhost:3000
```

Kall-flyten er: nettleser → intern API-route (`/api/run`) → begge SPARQL-
endepunkter. Proxyen gjør at CORS ikke er et problem, og at tidtakingen
skjer server-side. Fordi routen kjører på **din maskin** under `npm run dev`,
virker verktøyet selv om test-Fuseki kun er tilgjengelig via Udir-VPN.

## Deploy til Vercel

Fungerer så lenge begge endepunktene er tilgjengelige fra Vercel sine
servere (dvs. offentlig, uten VPN). Per august 2026 svarer test-endepunktet
offentlig. Merk at `/api/run` har `maxDuration = 60` – en kald Fuseki-start
kan sprenge dette på Vercel. Kjør da en runde med lav `iterations` først for
å varme opp, eller kjør verktøyet lokalt.

For å lagre spørringer og batch-rapporter på Vercel: koble til en Blob-store
(se «Sette opp Blob» over).

## Konfigurasjon

Endepunktene løses i denne rekkefølgen (se `lib/endpoints.ts`):

1. Overstyring i UI-et (seksjonen «Endepunkter»)
2. Miljøvariabler `PROD_SPARQL_URL` / `TEST_SPARQL_URL` (se `.env.example`)
3. Innebygde defaults

## Struktur

| Fil | Ansvar |
| --- | --- |
| `app/page.tsx` | Skjema + resultatvisning + lagrede spørringer (klient) |
| `app/report/` | Rapportoversikt og enkeltrapport (server-komponenter) |
| `app/api/run/route.ts` | Kjører målingen for én spørring, returnerer resultat + diff |
| `app/api/batch/route.ts` | Kjører alle lagrede spørringer, lagrer en rapport |
| `app/api/queries/route.ts` | CRUD på `.rq`-filene i `queries/` |
| `app/api/reports/route.ts` | Lister rapport-sammendrag |
| `app/api/config/route.ts` | Eksponerer de løste endepunkt-URL-ene til UI-et |
| `lib/benchmark.ts` | Tidtaking, warmup, interleaved/pool-iterasjoner, aggregering |
| `lib/sparql.ts` | Parsing og semantisk diff av SPARQL JSON-resultater |
| `lib/store.ts` | Lagrede spørringer og rapporter – lokale filer eller Vercel Blob |
| `lib/endpoints.ts` | Løser de to endepunkt-URL-ene |
| `lib/types.ts` | Delte typer |
