# Avvik i «Samling av SPARQL-spørringer» — GraphDB vs. Jena Fuseki

**Kilde:** [Samling av SPARQL-spørringer](https://github.com/Utdanningsdirektoratet/Grep_SPARQL/wiki/Samling-av-SPARQL-sp%C3%B8rringer) (GitHub-wiki)
**Endepunkter:** prod GraphDB `sparql-data.udir.no/repositories/201906` vs. test Fuseki `ca-sparql-dev…azurecontainerapps.io/201906/query`
**Kjørt:** 2026-09-01, alle spørringer som POST med `application/x-www-form-urlencoded`, `Accept: application/sparql-results+json`.

> **Oppdatering 2026-09-01 (wiki-revisjon `e0ebe89`):** All bruk av `rdf:` i
> samlingen er nå forsynt med `PREFIX rdf:`. Re-verifisert:
> **xb10g46s** og **xb11g04K** gir nå HTTP 200 fra Fuseki, og xb11g04K gir
> **332 rader helt likt** GraphDB. Årsak ③ er dermed lukket. Gjenstår:
> **xb10g54U** (fortsatt HTTP 400 — det er *ikke* et prefiks-problem, se ②) og
> ①-spørringene (konfigurasjon: ontologien i Fuseki-datasettet). xb10g46s er nå
> en ren dublett av xb10g44T og deler samme ①-avvik.

De 14 spørringene med avvik faller i **fire årsaker**. Tre av dem er (var)
spørrings­feil som GraphDB tolererer stille og Jena avviser (eller svarer
annerledes på) — ikke feil i Fuseki. Den fjerde er kosmetisk.

| Ref | Spørring | Årsak | Fuseki-svar | Status |
| --- | --- | --- | --- | --- |
| xb10g44T | List RDF-typer (m/ prefiks) | ① ontologi mangler i Fuseki | 44 rader (GraphDB 51) | Fuseki gir det «rene» svaret; se fix |
| xb10g46s | – samme (nå m/ `PREFIX rdf:`) | ③→① prefiks lagt til; nå ontologi-diff | 44 rader (GraphDB 51) | HTTP 400 løst; identisk med xb10g44T |
| xb10g46D | – samme, med `a` | ① ontologi mangler i Fuseki | 44 rader (GraphDB 51) | som xb10g44T |
| xb10g47z | List alle properties | ① ontologi mangler i Fuseki | 155 (GraphDB 161) | 6 skjema-predikater faller bort |
| xb10g48C | Antall tripler | ① ontologi mangler i Fuseki | 1 209 749 (GraphDB 1 235 817) | Δ = 26 068 ≈ ontologien |
| xb10g48Q | Antall entiteter | ① ontologi mangler i Fuseki | 49 535 (GraphDB 62 555) | +13 020 ontologi-individer i GraphDB |
| xb10g49& | Antall RDF-typer | ① ontologi mangler i Fuseki | 44 (GraphDB 51) | +7 meta-klasser i GraphDB |
| xb10g49w | Distinkte predikater | ① ontologi mangler i Fuseki | 13 000 (GraphDB 13 006) | +6 skjema-predikater |
| xb10g49G | Distinkte subjektnoder | ① ontologi mangler i Fuseki | 85 474 (GraphDB 98 502) | +13 028 ontologi-URI-er |
| xb10g50b | Distinkte objektnoder | ① ontologi mangler i Fuseki | 135 053 (GraphDB 148 060) | +13 007 ontologi-URI-er |
| xb10g53Y | Likelydende kompetansemål (LK20) | ④ `GROUP_CONCAT`-rekkefølge | 2894 rader, **like** verdier | Ingen reell forskjell |
| xb10g54n | Likelydende LK06 vs. LK20 | ④ `GROUP_CONCAT`-rekkefølge | 109 rader, **like** verdier | Ingen reell forskjell |
| xb10g54U | Kompetansemål (LK20), tving `@sme`→`@nob` | ② `?spraak` bundet to ganger | **HTTP 400**, ingen JSON | Utestående — døp om BIND-variabelen |
| xb11g04K | Diff kompetansemål LK06-plan vs. LK20-plan | ③ udeklarert `rdf:type` | 332 rader, **helt likt** | ✅ Løst i wiki (`PREFIX rdf:` lagt til) |

Status nå: **årsak ③ er lukket** i wikien. Fuseki gir **identisk resultat** som
GraphDB for xb11g04K (332 rader). Utestående er **xb10g54U** (årsak ②) og
**①**-spørringene (konfigurasjon) — xb10g44T, xb10g46s (≡ xb10g44T), xb10g46D,
xb10g47z, xb10g48C, xb10g48Q, xb10g49&, xb10g49w, xb10g49G, xb10g50b.

---

## ① Grep-ontologien (TBox) ligger i GraphDB-repoet, men ikke i Fuseki-datasettet

Dette forklarer **ni distinkte spørringer** (xb10g46s teller som en tiende, men er
etter prefiks-fiksen identisk med xb10g44T). Alle er «utforskende»/statistikk­
spørringer som teller eller lister *alt* i grafen uten å avgrense til Grep-innhold.

### Bevis

| Kontrollspørring | GraphDB | Fuseki |
| --- | --- | --- |
| `?s ?p ?o . FILTER(STRSTARTS(STR(?s), "http://psi.udir.no/ontologi/kl06/"))` — antall | **25 998** | **0** |
| `?s rdfs:subPropertyOf ?o` — antall | 13 009 | 0 |
| `?s rdfs:subClassOf ?o` — antall | 9 | 0 |
| `?s rdfs:domain ?o` — antall | 6 | 0 |
| Totalt antall tripler | 1 235 817 | 1 209 749 |

Differansen i totalt antall tripler (26 068) er så godt som nøyaktig antallet
tripler med subjekt i ontologi-navnerommet (25 998); resten (~70) er GraphDB
sitt innebygde PROTON-systemskjema (`http://proton.semanticweb.org/…`, 5 tripler)
og noen få aksiom-tripler.

Ontologien definerer hver av de ~13 000 egenskapene med minst
`a rdf:Property` (evt. `owl:TransitiveProperty` / `owl:SymmetricProperty`) og
`rdfs:subPropertyOf …`, og klassene med `a rdfs:Class`. Det er dette som blåser
opp tellingene:

- **De 7 ekstra RDF-typene** i GraphDB (xb10g44T / xb10g46D / xb10g49&):
  `rdf:Property`, `rdf:List`, `rdfs:Class`, `rdfs:Datatype`,
  `rdfs:ContainerMembershipProperty`, `owl:TransitiveProperty`,
  `owl:SymmetricProperty`. De 44 Fuseki returnerer er de faktiske grep-typene
  (jf. «44 grep-typer» i wiki-teksten).
- **De 6 ekstra predikatene** i GraphDB (xb10g47z / xb10g49w):
  `rdfs:subClassOf`, `rdfs:subPropertyOf`, `rdfs:domain`, `rdfs:range`,
  `owl:inverseOf`, `proton:transitiveOver`.
- **+~13 000 entiteter/subjekt-/objektnoder**: ontologiens egenskaps- og
  klasse-URI-er, som hver får `a …` og opptrer som subjekt og objekt.

Det er **ingen inferens-effekt** her: `rdfs:Resource`-typing, superklasse­
ekspansjon på instanser og `owl:sameAs` gir 0 treff på begge motorer, og
`d:NOR01-06 a ?t` gir nøyaktig samme ene type (`u:laereplan_lk20`) på begge.
Forskjellen er utelukkende at **skjemaet er lastet inn ett sted og ikke det
andre**. Det ligger heller ikke noe i navngitte grafer — alt er i default-grafen
på begge.

### Hva bør gjøres

**Anbefalt:** last Grep-ontologien inn i Fuseki-datasettet også, slik at
endepunktene er innholdsmessig like. Da forsvinner alle ①-avvikene av seg selv,
og spørringene i wikien trenger ingen endring.

Hvis ontologien **bevisst** skal holdes utenfor Fuseki, så er Fuseki-tallene de
«riktige» tallene for Grep-*innholdet*, og da bør de forventede verdiene i wikien
oppdateres. For spørringene som skal liste typer/properties kan man i tillegg
avgrense eksplisitt:

```sparql
# xb10g44T / xb10g46D — bare grep-typer, likt svar (44) på begge motorer
PREFIX u: <http://psi.udir.no/ontologi/kl06/>
SELECT DISTINCT ?type
WHERE { [] a ?type
        FILTER(STRSTARTS(STR(?type), "http://psi.udir.no/ontologi/kl06/")) }
```

(Alternativt er «Grep-måten» xb10g47m — `[] u:grep-type ?type` — allerede
robust: 44 på begge.)

For statistikk-spørringene xb10g48C/48Q/49&/49w/49G/50b: hvis de skal telle
Grep-innhold uavhengig av om skjemaet er lastet, legg på
`FILTER(!STRSTARTS(STR(?s), "http://psi.udir.no/ontologi/kl06/"))` (og tilsvarende
for `?o` der det er en nodetelling). Da gir GraphDB samme tall som Fuseki.

---

## ② `?spraak` er bundet to ganger (xb10g54U) — Fuseki gir HTTP 400

```
Parse error: Variable used when already in-scope: ?spraak
in ((concat (group_concat distinct (separator ', ') ?sprk)) AS ?spraak)
```

Spørringen bruker `?spraak` til **to ting samtidig**:

1. som alias for aggregatet i `SELECT`:
   `(concat(group_concat(distinct ?sprk;separator=', ')) as ?spraak)`
2. som mål for et `BIND` inne i `WHERE`:
   `BIND(IF(?fastsattSpr = d:sme, "nob", "default") AS ?spraak)`

Å `BIND`-e til et navn som allerede er i bruk i samme gruppe-graf-mønster er en
**syntaksfeil** i SPARQL 1.1. GraphDB godtar det likevel (BIND-en «vinner» inne i
`WHERE`, aggregatet overstyrer i utdata); Jena avviser hele spørringen.

### Omskriving (verifisert: 1000 rader identisk på begge motorer)

Døp om BIND-variabelen — den er egentlig en *språkvelger* for filtrene, ikke
listen over tilgjengelige språk:

```sparql
PREFIX u: <http://psi.udir.no/ontologi/kl06/>
PREFIX st: <https://data.udir.no/kl06/v201906/status/status_>
PREFIX d: <http://psi.udir.no/kl06/>
SELECT ?lpKode ?lpTittel ?status ?kmsKode ?kmsTittel ?kompKode ?kompTtittel ?urlData ?fastsattSpr
       (concat(group_concat(distinct ?sprk;separator=', ')) AS ?spraak)
WHERE {
    ?komp a u:kompetansemaal_lk20 ;
          u:url-data ?urlData ; u:kode ?kompKode ; u:tittel ?kompTtittel ;
          u:rekkefoelge ?rekkefoelge ;
          u:tilhoerer-kompetansemaalsett ?kms ; u:tilhoerer-laereplan ?lp .
    ?lp  u:kode ?lpKode ; u:status ?st ; u:fastsatt-spraak ?fastsattSpr ;
         u:tilgjengelige-spraak ?spr ; u:tittel ?lpTittel .
    ?kms u:kode ?kmsKode ; u:kortform ?kmsTittel .
    ?spr u:kode ?sprk .
    BIND( IF(?st = st:publisert, str("publisert"), "utgått")  AS ?status )
    BIND( IF(?fastsattSpr = d:sme, "nob", "default")          AS ?visSpraak )   # ← omdøpt
    FILTER (lang(?kompTtittel) = ?visSpraak)
    FILTER (lang(?lpTittel)    = ?visSpraak)
    FILTER (lang(?kmsTittel)   = ?visSpraak)
}
GROUP BY ?lpKode ?lpTittel ?status ?kmsKode ?kmsTittel ?kompKode ?kompTtittel ?urlData ?fastsattSpr
ORDER BY ?lpKode ?kmsKode ?kompKode      # ← var ?lpKode ?kms ?rekkefoelge; ikke-grupperte kolonner
LIMIT 1000
```

To endringer: `?spraak` → `?visSpraak` i `BIND` + de tre `FILTER`-linjene, og
`ORDER BY` sortert på grupperte kolonner (`?kms`/`?rekkefoelge` er ikke med i
`GROUP BY` og er ustabile å sortere på i en aggregat-spørring).

> `?spraak`-kolonnen (aggregatet) kommer fortsatt i ulik intern rekkefølge på de
> to motorene — se ④.

---

## ③ Udeklarert `rdf:`-prefiks — Fuseki ga HTTP 400 ✅ RETTET I WIKI

```
Parse error: Unresolved prefixed name: rdf:type
```

GraphDB har et sett **innebygde, ikke-standard prefiks-snarveier** (`rdf`, `rdfs`,
`owl`, `xsd`, `sesame`, …) som gjelder uten `PREFIX`-linje. Jena følger
spesifikasjonen: alle prefikser unntatt `bnode:`-liknende må deklareres.

Begge de rammede spørringene (**xb10g46s**, **xb11g04K**) har nå fått
`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>` i wikien
(revisjon `e0ebe89`), og begge gir HTTP 200 fra Fuseki.

### xb11g04K — fullt løst

Første `UNION`-gren brukte `rdf:type` med bare `u:` og `d:` deklarert. Med
`PREFIX rdf:` på plass gir begge motorer nå **332 rader, helt likt**
(re-verifisert 2026-09-01). Ingen videre tiltak.

> Alternativ som også hadde virket: bytte `rdf:type` → nøkkelordet `a` (slik
> søsterspørringen xb11g04u gjør). `PREFIX rdf:` er like greit.

### xb10g46s — HTTP 400 løst, men avviker fortsatt (nå årsak ①)

Med `PREFIX rdf:` lagt til er spørringen funksjonelt en **dublett av xb10g44T**
og gir samme svar som den: 44 rader mot Fuseki, 51 mot GraphDB — differansen er
nå utelukkende ontologien (se ①), ikke prefikset.

> Hvis poenget i wikien er å *vise* GraphDB sin innebygde prefiks-snarvei, bør
> det stå eksplisitt at det er en ikke-standard GraphDB-utvidelse som ikke virker
> på andre SPARQL-motorer — ellers er xb10g46s bare støy ved siden av xb10g44T.

---

## ④ `GROUP_CONCAT`-rekkefølge (xb10g53Y, xb10g54n) — ingen reell forskjell

Begge spørringene returnerer **nøyaktig samme antall rader** (2894 hhv. 109) og
samme `COUNT`-verdier. Det eneste som skiller, er **rekkefølgen på kodene inne i
`GROUP_CONCAT`-strengen** (`?kompArray`, `?kompArray1`, `?kompArray2`):

```
GraphDB : "KM495, KM502, KM506, KM516, …"
Fuseki  : "KM680, KM11374, KM692, KM11396, …"   (samme mengde, annen rekkefølge)
```

Verifisert: sorterer man kodene i hver celle, blir de to resultatsettene
**bit-for-bit identiske**.

`GROUP_CONCAT` har **udefinert rekkefølge** i SPARQL 1.1 — verken GraphDB eller
Jena gjør noe galt. Trenger man stabil rekkefølge:

```sparql
# deterministisk: mat aggregatet fra en indre sortert sub-SELECT
SELECT ?tittel1 (GROUP_CONCAT(?km2; separator=", ") AS ?kompArray) (COUNT(?km2) AS ?antLike)
WHERE {
  { SELECT ?tittel1 ?km2 ?k2 WHERE {
      # … samme mønster som før …
    } ORDER BY ?km2 }
}
GROUP BY ?tittel1
ORDER BY DESC(?antLike)
```

Eller enklere: la konsumenten sortere kommalisten. Verktøyet i dette repoet
normaliserer allerede dette i diffen.

> Tips: `concat(group_concat(…))` — den ytre `concat`-en med ett argument — er en
> ren no-op og et GraphDB-arv (Virtuoso-vane). Den kan fjernes; `group_concat(…)`
> alene virker likt på begge.

---

## Reproduksjon

```bash
Q='SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o }'
for URL in \
  https://sparql-data.udir.no/repositories/201906 \
  https://ca-sparql-dev.yellowbeach-43b18c61.norwayeast.azurecontainerapps.io/201906/query
do
  curl -s -X POST "$URL" \
    -H 'Accept: application/sparql-results+json' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "query=$Q"
  echo
done
```

Bytt ut `$Q` med spørringene fra wikien. `--data-urlencode "query@fil.rq"` tar
spørringen fra fil.

## Oppsummert

| Årsak | Spørringer | Er det en Fuseki-feil? | Tiltak | Status 2026-09-01 |
| --- | --- | --- | --- | --- |
| ① Ontologien mangler i Fuseki-datasettet | xb10g44T, xb10g46s, xb10g46D, xb10g47z, xb10g48C, xb10g48Q, xb10g49&, xb10g49w, xb10g49G, xb10g50b | Nei — konfigurasjon | Last ontologien inn i Fuseki (anbefalt), ev. oppdater forventede tall + avgrens spørringene | Utestående |
| ② `?spraak` bundet to ganger | xb10g54U | Nei — spørringsfeil GraphDB slapp forbi | Døp om BIND-variabel | **Utestående** (HTTP 400) |
| ③ Udeklarert `rdf:`-prefiks | xb10g46s, xb11g04K | Nei — spørringsfeil GraphDB slapp forbi | Legg til `PREFIX rdf:` / bruk `a` | ✅ Rettet i wiki; xb11g04K nå identisk, xb10g46s går over i ① |
| ④ `GROUP_CONCAT`-rekkefølge | xb10g53Y, xb10g54n | Nei — udefinert i SPARQL 1.1 | Ingen (ev. indre `ORDER BY`) | Ingen reell forskjell |

**Neste steg:** (1) rett `?spraak`-kollisjonen i xb10g54U, (2) avklar om
Grep-ontologien skal lastes inn i Fuseki-datasettet — det lukker de ti
①-spørringene uten videre endringer i wikien.
