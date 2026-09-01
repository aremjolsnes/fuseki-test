# Avvik i «Samling av SPARQL-spørringer» — GraphDB vs. Jena Fuseki

**Kilde:** [Samling av SPARQL-spørringer](https://github.com/Utdanningsdirektoratet/Grep_SPARQL/wiki/Samling-av-SPARQL-sp%C3%B8rringer) (GitHub-wiki)
**Endepunkter:** prod GraphDB `sparql-data.udir.no/repositories/201906` vs. test Fuseki `ca-sparql-dev…azurecontainerapps.io/201906/query`
**Kjørt:** 2026-09-01, alle spørringer som POST med `application/x-www-form-urlencoded`, `Accept: application/sparql-results+json`.

> **Oppdatering 2026-09-01 (wiki-revisjon `e0ebe89`):** All bruk av `rdf:` i
> samlingen er nå forsynt med `PREFIX rdf:`. Re-verifisert:
> **xb10g46s** og **xb11g04K** gir nå HTTP 200 fra Fuseki, og xb11g04K gir
> **332 rader helt likt** GraphDB. Årsak ③ er dermed lukket. Gjenstår:
> **xb10g54U** (fortsatt HTTP 400 — det er *ikke* et prefiks-problem, se ②) og
> ①-spørringene (GraphDB kjører med RDFS-inferens på, Fuseki uten — den
> asserterte dataen er identisk). xb10g46s er nå en ren dublett av xb10g44T.

De 14 spørringene med avvik faller i **fire årsaker**. Tre av dem er (var)
spørrings­feil som GraphDB tolererer stille og Jena avviser (eller svarer
annerledes på) — ikke feil i Fuseki. Den fjerde er kosmetisk.

| Ref | Spørring | Årsak | Fuseki-svar | Status |
| --- | --- | --- | --- | --- |
| xb10g44T | List RDF-typer (m/ prefiks) | ① GraphDB-inferens | 44 rader (GraphDB 51) | Fuseki gir den rene asserterte dataen |
| xb10g46s | – samme (nå m/ `PREFIX rdf:`) | ③→① prefiks lagt til; nå inferens-diff | 44 rader (GraphDB 51) | HTTP 400 løst; identisk med xb10g44T |
| xb10g46D | – samme, med `a` | ① GraphDB-inferens | 44 rader (GraphDB 51) | som xb10g44T |
| xb10g47z | List alle properties | ① GraphDB-inferens | 155 (GraphDB 161) | +6 skjema-predikater fra regelsettet |
| xb10g48C | Antall tripler | ① GraphDB-inferens | 1 209 749 (GraphDB 1 235 817) | Δ = 26 068 utledede tripler; assertert data er lik |
| xb10g48Q | Antall entiteter | ① GraphDB-inferens | 49 535 (GraphDB 62 555) | +13 020 fra `?p a rdf:Property` |
| xb10g49& | Antall RDF-typer | ① GraphDB-inferens | 44 (GraphDB 51) | +7 RDFS/OWL-vokabular-klasser |
| xb10g49w | Distinkte predikater | ① GraphDB-inferens | 13 000 (GraphDB 13 006) | +6 skjema-predikater fra regelsettet |
| xb10g49G | Distinkte subjektnoder | ① GraphDB-inferens | 85 474 (GraphDB 98 502) | +13 028 predikat-URI-er som `rdf:Property` |
| xb10g50b | Distinkte objektnoder | ① GraphDB-inferens | 135 053 (GraphDB 148 060) | +13 007 predikat-URI-er / meta-klasser |
| xb10g53Y | Likelydende kompetansemål (LK20) | ④ `GROUP_CONCAT`-rekkefølge | 2894 rader, **like** verdier | Ingen reell forskjell |
| xb10g54n | Likelydende LK06 vs. LK20 | ④ `GROUP_CONCAT`-rekkefølge | 109 rader, **like** verdier | Ingen reell forskjell |
| xb10g54U | Kompetansemål (LK20), tving `@sme`→`@nob` | ② `?spraak` bundet to ganger | **HTTP 400**, ingen JSON | Utestående — døp om BIND-variabelen |
| xb11g04K | Diff kompetansemål LK06-plan vs. LK20-plan | ③ udeklarert `rdf:type` | 332 rader, **helt likt** | ✅ Løst i wiki (`PREFIX rdf:` lagt til) |

Status nå: **årsak ③ er lukket** i wikien. Fuseki gir **identisk resultat** som
GraphDB for xb11g04K (332 rader). Utestående er **xb10g54U** (årsak ②) og
**①**-spørringene (konfigurasjon) — xb10g44T, xb10g46s (≡ xb10g44T), xb10g46D,
xb10g47z, xb10g48C, xb10g48Q, xb10g49&, xb10g49w, xb10g49G, xb10g50b.

---

## ① GraphDB kjører med RDFS-resonnering på; Fuseki uten reasoner

> **Rettet 2026-09-01:** en tidligere versjon av dette dokumentet forklarte
> avviket med at «Grep-ontologien er lastet i GraphDB, ikke i Fuseki». Det er
> **feil**. Den *asserterte* dataen er identisk på begge (se bevis under). Hele
> differansen er tripler som GraphDB sin **regelmotor utleder**, og som Fuseki
> ikke har fordi den kjører uten reasoner.

Dette forklarer **ni distinkte spørringer** (xb10g46s teller som en tiende, men er
etter prefiks-fiksen identisk med xb10g44T). Alle er «utforskende»/statistikk­
spørringer som teller eller lister *alt* i grafen uten å avgrense til Grep-innhold.

### Bevis: den asserterte dataen er lik

GraphDB kan spørres på kun eksplisitte (asserterte) tripler via
`FROM <http://www.ontotext.com/explicit>`. Da får man **nøyaktig Fuseki-tallene**:

| Måltall | GraphDB (m/ inferens) | GraphDB **kun eksplisitt** | Fuseki |
| --- | --- | --- | --- |
| Antall tripler | 1 235 817 | **1 209 749** | **1 209 749** |
| Distinkte RDF-typer (`[] a ?o`) | 51 | **44** | **44** |
| Distinkte predikater | 13 006 | **13 000** | **13 000** |
| Entiteter (`?s a []`) | 62 555 | **49 535** | **49 535** |
| `?s a rdf:Property` | 13 013 | **0** | **0** |

Fuseki mangler altså **ingen data**. Alle 26 068 ekstra triplene i GraphDB er
regelmotor-output.

### Hva regelmotoren lager

GraphDB-repoet kjører med et RDFS/OWL-Horst-aktig regelsett (Ontotext sitt
standardoppsett). Grep-dataene har **ingen asserterte klasse- eller
egenskaps­hierarkier** (0 `rdfs:domain`, 0 `rdfs:range`, 0 reell
`rdfs:subClassOf`/`rdfs:subPropertyOf` mellom Grep-termer — verifisert), så
regelmotoren har ikke noe *innholdsmessig* å utlede. Det den produserer er ren
skjema-boilerplate:

- `?p a rdf:Property` for hvert predikat (~13 013 tripler) → blåser opp
  entitets-, subjekt- og objektnode-tellingene med ~13 000.
- `?p rdfs:subPropertyOf ?p` (refleksivt) for hvert predikat (~13 006).
- `?c a rdfs:Class` for hver klasse.
- RDFS/OWL-vokabularets egne aksiomer: `rdf:Alt rdfs:subClassOf rdfs:Container`,
  `rdf:XMLLiteral rdfs:subClassOf rdfs:Literal`, `rdf:type a rdf:Property`, osv.
  Det er disse som gir **de 7 ekstra «RDF-typene»** (`rdf:Property`, `rdf:List`,
  `rdfs:Class`, `rdfs:Datatype`, `rdfs:ContainerMembershipProperty`,
  `owl:TransitiveProperty`, `owl:SymmetricProperty`) og **de 6 ekstra
  predikatene** (`rdfs:subClassOf`, `rdfs:subPropertyOf`, `rdfs:domain`,
  `rdfs:range`, `owl:inverseOf`, `proton:transitiveOver` — de to siste fra
  GraphDB sitt innebygde PROTON-skjema, ~5 tripler).

**Ingen instans-nivå-inferens er i spill:** `d:NOR01-06 a ?t` gir nøyaktig samme
ene type (`u:laereplan_lk20`) på begge, `rdfs:Resource`-typing og `owl:sameAs`
gir 0 på begge, og det finnes ingen navngitte grafer.

### Er dette en svakhet ved Fuseki?

**Nei, ikke i praksis.**

- Resonnering er ikke «innebygd» i GraphDB heller — det er et *konfigurert*
  regelsett som Ontotext slår på som standard. Jena kan også gjøre RDFS-inferens
  (assembler-oppsett med `ja:RDFSReasoner` / `InfModel`); Fuseki har det bare av
  som standard.
- For Grep-data utleder RDFS-resonnering **ingenting brukbart** — det er ingen
  hierarkier å resonnere over. Den eneste effekten er «hvert predikat er en
  `rdf:Property`»-boilerplate som *bare* påvirker introspeksjons-tellinger.
- **Ingen innholdsspørring** — verken i wiki-samlingen eller i vanlig bruk —
  er avhengig av de utledede triplene. Instans-spørringer treffer identisk
  assertert data.
- Det slår først ut hvis en konsument eksplisitt spør `?x a rdf:Property`,
  `?x a rdfs:Class` eller refleksiv `rdfs:subPropertyOf` — skjema-introspeksjon,
  ikke datauttrekk. Ingen av spørringene i samlingen gjør det.

Grunnen til at man **ikke ser dette i vanlig SPARQL-praksis**: reelle spørringer
binder mot konkrete predikater (`u:tilhoerer-laereplan`) og klasseverdier
(`u:kompetansemaal_lk20`) — ABox-en — som er 100 % lik på begge motorer. De
utledede triplene dukker bare opp ved åpne skann (`?s ?p ?o`, `[] a ?type`,
`COUNT(*)`).

### Hva bør gjøres

1. **Enkleste vei:** behandle Fuseki-tallene som de *korrekte* tallene for den
   asserterte Grep-dataen, og oppdater forventede verdier i wikien
   (44 typer, 13 000 predikater, 1 209 749 tripler, osv.). GraphDB sitt
   `FROM <http://www.ontotext.com/explicit>` gir de samme tallene og er nyttig
   for A/B-sjekk.
2. **Hvis full paritet ønskes:** slå på RDFS-resonnering i Fuseki (Jena
   assembler). Merk at det gjeninnfører nøyaktig den boilerplaten som blåste opp
   GraphDB-tallene — sjelden verdt det her.
3. **For type-/property-listene** (xb10g44T / xb10g46D / xb10g47z): «Grep-måten»
   xb10g47m — `[] u:grep-type ?type` — er allerede robust (44 på begge). Ev.
   avgrens eksplisitt:

   ```sparql
   PREFIX u: <http://psi.udir.no/ontologi/kl06/>
   SELECT DISTINCT ?type
   WHERE { [] a ?type
           FILTER(STRSTARTS(STR(?type), "http://psi.udir.no/ontologi/kl06/")) }
   ```

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
nå utelukkende GraphDB-inferensen (se ①), ikke prefikset.

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
| ① GraphDB kjører med RDFS-inferens, Fuseki uten | xb10g44T, xb10g46s, xb10g46D, xb10g47z, xb10g48C, xb10g48Q, xb10g49&, xb10g49w, xb10g49G, xb10g50b | Nei — konfigurasjon; assertert data er identisk (begge 1 209 749) | Oppdater forventede tall i wikien til de asserterte (anbefalt), ev. slå på RDFS-reasoner i Fuseki | Utestående (kosmetisk) |
| ② `?spraak` bundet to ganger | xb10g54U | Nei — spørringsfeil GraphDB slapp forbi | Døp om BIND-variabel | **Utestående** (HTTP 400) |
| ③ Udeklarert `rdf:`-prefiks | xb10g46s, xb11g04K | Nei — spørringsfeil GraphDB slapp forbi | Legg til `PREFIX rdf:` / bruk `a` | ✅ Rettet i wiki; xb11g04K nå identisk, xb10g46s går over i ① |
| ④ `GROUP_CONCAT`-rekkefølge | xb10g53Y, xb10g54n | Nei — udefinert i SPARQL 1.1 | Ingen (ev. indre `ORDER BY`) | Ingen reell forskjell |

**Neste steg:** (1) rett `?spraak`-kollisjonen i xb10g54U, (2) bestem hvordan
①-avviket skal håndteres — enten oppdatere de forventede tallene i wikien til den
asserterte dataen (Fuseki-tallene), eller slå på RDFS-resonnering i Fuseki for
full paritet. Ingen av delene haster: assertert data er allerede identisk, og
ingen innholdsspørring påvirkes.
