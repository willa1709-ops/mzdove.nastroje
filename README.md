# Mzdové nástroje

Webové kalkulačky pro českou mzdovou a personální agendu.

## Stav projektu

První implementovaný nástroj: **Dovolená** se čtyřmi variantami:

1. **Nový nástup** – datum nástupu, týdenní úvazek (výchozí 40 h), výměra dovolené (výchozí 4 týdny).
2. **Konec PP** – volba „Nastoupil letos?“, datum ukončení, úvazek a výměra.
3. **Dlouhodobá nemoc (§ 216)** – volitelná data nástupu a ukončení, povinné období nemoci, model započítání 12/20 TPD.
4. **DPP** – termín dohody, započitatelné hodiny, fiktivní TPD 20 hodin a podmínky 28 kalendářních dnů + 80 hodin.

Všechny varianty zobrazují počet **celých započtených týdenních pracovních dob**, **nárok v týdnech dovolené**, **nárok v hodinách** a **dosazený vzorec**. Hodiny se zaokrouhlují nahoru.

## Spuštění

Aplikace je statický web (HTML, CSS, ES modules) bez balíčkovacích závislostí.

```bash
python3 -m http.server 8000
```

Otevřete `http://localhost:8000`.

Testy výpočetní logiky:

```bash
npm test
```

## GitHub Pages

Repozitář založte například jako `mzdove-nastroje`. Nahrajte obsah této složky přímo do kořene repozitáře. V **Settings → Pages** zvolte **Deploy from a branch**, hlavní větev `main` a adresář `/ (root)`. Protože jde o statický web, není nutný build.

## Legislativní parametry

Centrální evidence: `src/legislation/parameters.js`. U každého roku evidovat hodnoty, datum ověření a primární odkazy. **Kontrola na začátku každého roku a kdykoliv na vyžádání.** Neověřené roky používají dočasně parametry 2026 a ve webu jsou výslovně označeny jako neověřené.

Pravidla pro rok 2026 zkontrolována 8. 10. 2026 podle:

- [Zákoník práce č. 262/2006 Sb. (e-Sbírka)](https://e-sbirka.gov.cz/sb/2006/262)
- [MPSV – doby posuzované jako výkon práce](https://ppropo.mpsv.cz/X46Dobyposuzovanejakovykonprace)
- [MPSV – dovolená u dohod](https://mpsv.gov.cz/novinky-v-pracovnim-pravu)

### Důležité omezení modelu

U pracovního poměru se bez rozpisu směn počítá s rovnoměrným pětidenním týdnem (každý všední den = 1/5 týdenního úvazku), jinak může výsledek nesouhlasit. Není řešena nepravidelná práce, změny úvazku během roku, různé další započitatelné doby, přesčasové dopady ani specifické individuální případy. U nemoci jsou zohledněny jen zadané intervaly, nikoli kombinace s jinými překážkami podle § 216. Zobrazené „snížení nároku“ není krácením dovolené podle § 223.

**Nástroj je pracovní prototyp, nikoli plně ověřený mzdový software. Před praktickým nasazením je nutné validovat skutečnou evidenci směn, absencí a hraniční situace.**

## Další plánované nástroje

- Pravděpodobný výdělek
- Exekuce
- Odstupné
- Dítě: mateřská, otcovská, rodičovská

`shared/` vznikne až podle reálné potřeby sdílení funkcí, ne předem.

## Struktura

```text
index.html
assets/styles.css
src/app.js
src/dovolena/calculations.js
src/legislation/parameters.js
tests/calculations.test.js
```