# Overgang fra GraphDB til Jena Fuseki — hva datakonsumenter bør sjekke

**Til:** konsumenter av Udirs SPARQL-tjeneste
**Status:** utkast — fyll inn `[hakeparenteser]` før utsending

---

Udir bytter ut SPARQL-motoren bak `[prod-URL]` med Jena Fuseki. Vi er i testperiode nå mot `[test-URL]`, uten fastsatt dato for produksjonssetting.
Dere bør bruke denne perioden til å verifisere egne spørringer.

## Gjør dette nå

- Kjør spørringene deres mot testendepunktet og sammenlign svarene med produksjon.
- Meld avvik til `[kontakt]` så tidlig som mulig.
- Grunnregel: sammenlign (semantisk) på RDF-*verdinivå*, ikke tegn-for-tegn på serialiseringen.

## A. Forskjeller i svarformat — gjør parsingen tolerant

Observert i vår testing:

- **`xsd:string`:** GraphDB utelater datatypen på rene strenger, Fuseki tar den med. Behandle «ren literal» og `xsd:string` som samme term.
- **Ubundet vs. tom streng:** en variabel kan mangle helt i en rad i stedet for å være `""`. Særlig `GROUP_CONCAT` / `MIN` / `MAX` / `SAMPLE` over en tom gruppe: GraphDB gir `""`, Fuseki gir ubundet. Ikke anta at hver SELECT-variabel finnes i hver rad.
- **Rekkefølge:** verdier i `GROUP_CONCAT`, og rader uten eksplisitt `ORDER BY`,
  kommer i ulik rekkefølge. SPARQL garanterer ingen rekkefølge her.

Vær også forberedt på (vanlig ved motorbytte):

- **Tall-literaler:** `"1"^^xsd:integer` vs. `"1.0"`, `xsd:int` vs.
  `xsd:integer`, ulik kanonisk form på desimaltall/boolean. Sammenlign på verdi.
- **Blanke noder** (`_:b0`) har vilkårlige, flyktige navn — aldri lagre eller match på dem.
- **Whitespace / pretty-print** i JSON/CSV/XML varierer (bl.a. CSV-siteringsstil). Parse, ikke streng-sammenlign.
- Rekkefølgen på `head.vars` og på nøkler i JSON-objekter er ikke garantert.

## B. Se over spørringene

- **Uttrykk som kan feile** (`xsd:integer(...)`, `REPLACE`, `REGEX`, aritmetikk):
  Jena er strengere enn GraphDB. En feil i `FILTER` fjerner raden; en feil i `BIND` gir ubundet variabel. Vern med `COALESCE(...)` / `IF(BOUND(...), ...)`.
- **`FILTER` inne i `OPTIONAL`** filtrerer ikke ytre rader — bare innenfor den optionale blokken.
- **`OPTIONAL`-blokker som deler variabler** (samme variabel bundet i én OPTIONAL og brukt i FILTER/BIND i en annen, eller både i og utenfor en OPTIONAL) er «not well-designed» og kan gi ulikt resultat mellom motorene. Bygg om til enkle mønstre.
- **`GROUP BY`** på en variabel som kan være ubundet eller flerverdi grupperer ulikt.
- **Motorspesifikke funksjoner/utvidelser** finnes ikke på Fuseki:
  fulltekst-connectorer, `rank` / `rdfrank`, SPIN / `spif:`, egne geo- eller similarity-funksjoner. Inventér alle ikke-standard prefikser i spørringene deres.
- **Regex-dialekt:** Fuseki bruker Java-regex (`\w`, Unicode-oppførsel, flagg kan avvike).
- **Standardgraf:** hvis spørringene deres ikke bruker `GRAPH` og forventer å se alle triplene, bekreft at standardgrafen på Fuseki er satt opp likt (union av
  navngitte grafer).

## C. Teknisk / operasjonelt

- **Ny URL og path:** `[prod-URL]` → `[test-URL]`, med path `/201906/query`.
- **Bruk POST** (`application/x-www-form-urlencoded` eller
  `application/sparql-query`) for lange spørringer — GET har lengdegrense.
- **Kaldstart:** testmiljøet kan bruke opptil ~20 sekunder på første kall etter inaktivitet. Sett romslige timeouts og retry.
- **Content negotiation:** bekreft at `Accept`-typene dere bruker svarer som forventet (`application/sparql-results+json`, `text/csv`, `…+xml`, Turtle/N-Triples for `CONSTRUCT`).
- **Feilrespons** har annet format enn GraphDB (ikke Tomcat-HTML-sider).
- **Ytelsesprofilen er annerledes** — noen spørringer raskere, noen tregere. Mål responstider på nytt.

## Tidslinje

Test nå. Vi varsler i god tid før produksjonssetting.
Spørsmål og avviksmeldinger: `[kontakt]`.
