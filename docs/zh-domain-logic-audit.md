# Chinese-string audit: domain logic in dsa-web

After [[zh-tables-removed-2026-08-15]] (UI fallback tables gone, `UiLanguage = 'en'`), Chinese characters that remain in `apps/dsa-web/src/**` are domain logic, not UI copy. This audit classifies them and recommends a disposition for each.

Categories used below:

- **KEEP-AS-IS** — defensive detection of Chinese input or backend payloads; load-bearing, leave alone.
- **EXTRACT** — Chinese strings spread across a feature; consolidate into one place.
- **DEAD** — reachable only via a UI path that no longer exists (`UiLanguage === 'en'`).
- **BUG** — Chinese surgery that papers over a missing API contract; the fix is upstream.

---

## A. `utils/decisionAction.ts` — Chinese-phrase lists (≈60 strings)

`utils/decisionAction.ts:105-161` lists Chinese verb phrases mapped to decision actions ("不建议买入" → avoid, "加仓" → add, etc.), and `:170-210` plus `:244-246` call `normalized.includes(...)` and `label.includes(...)` against the same set.

**Disposition: EXTRACT** — move the phrase arrays into a dedicated module, e.g. `utils/decisionAction/zhPhrases.ts`, with one exported `LEGACY_ZH_DECISION_PHRASES` const per category. Import the file from exactly one site (`decisionAction.ts`). Add a header comment:

> Defensive mapping of legacy Chinese action labels. Active only when the analysis response or imported history record was produced under `report_language=zh`; English UI does not consult these.

This keeps the parser correct without cluttering the main utility.

---

## B. `pages/ChatPage.tsx` + `utils/chatStockCode.ts` — duplicated Chinese-intent regexes

`pages/ChatPage.tsx:53-57` declares five regexes (`STRONG_COMPARE_STOCK_MESSAGE_RE`, `WEAK_COMPARE_…`, `CHOICE_COMPARE_…`, `LINKED_COMPARE_…`, `SWITCH_STOCK_MESSAGE_RE`). `utils/chatStockCode.ts:5-7` declares `LOWERCASE_TICKER_CONTEXT_RE` (the union of the five) and `INDICATOR_CONTEXT_RE`. They live in two files and partially overlap.

**Disposition: EXTRACT** — move every Chinese-intent regex into one module (`utils/chatIntent/zhPatterns.ts` or append to `chatStockCode.ts`), export named constants, and import them from both call sites. Drop the duplicates in `ChatPage.tsx`. Net code reduction while keeping Chinese user-input detection intact.

---

## C. `pages/BacktestPage.tsx` — Chinese prefix surgery

`pages/BacktestPage.tsx:44-47`:

```ts
return label
  .replace('市场阶段: ', '')
  .replace('市场阶段：', '')
  .replace('Market phase: ', '');
```

This is string surgery on a localized label returned by `getMarketPhaseSummaryLabel(...)`. The caller wants the trailing market-phase token only, so it strips a prefix that varies by punctuation (`: ` and `：`) and locale.

**Disposition: BUG** — `getMarketPhaseSummaryLabel` should return just the phase token, or expose `phaseLabelToken(row.marketPhaseSummary)` that returns the bare value. Then `phaseLabel` collapses to a one-liner. The Chinese-only `.replace` calls mask a missing API helper and would silently leave the prefix in place if the backend ever changes its separator.

---

## D. `api/error.ts` — Chinese fallback error matching

`api/error.ts:315` (`'必须提供 stock_code 或 stock_codes'`) and `:346` (`'内建选股引擎初始化失败', '选股功能初始化失败'`) include Chinese phrases in `includesAny(matchText, [...])` fallback chains.

**Disposition: KEEP-AS-IS (with caveat)** — these are defensive branches that fire only when the backend returns Chinese error text. With the UI pinned to English the backend almost certainly is too, but if a downstream operator switches `report_language=zh` while debugging, these patterns still surface a clean English error to the user. The cost (a few bytes) is worth the safety net. Leave them; consider adding a one-line comment explaining the defensive intent.

---

## E. `i18n/uiText.ts:33` — `'language.short.zh': '中'`

Self-label for the Chinese language option. With `UiLanguage = 'en'` type-locked at the provider and the language toggle removed, this key is unreachable.

**Disposition: DEAD** — delete the row. While here, scan `uiText.ts` for any other keys that only made sense in zh mode (e.g. `language.long.zh`, `language.name.zh`) and remove them.

---

## F. `utils/validation.ts:9` — `SUPPORTED_QUERY_CHARACTERS`

`/^[A-Z0-9.㐀-鿿\s]+$/` accepts CJK Unified Ideographs (U+4E00–U+9FFF) so users can paste Chinese stock names.

**Disposition: KEEP-AS-IS** — this is a stock-code/name input validator, not a UI string. Chinese stock names (`贵州茅台`) are valid input.

---

## G. Test fixtures — Chinese strings in `.test.ts` / `.test.tsx`

`utils/__tests__/decisionAction.test.ts`, `utils/__tests__/markdown.stock-report.test.ts`, `utils/__tests__/portfolioFormat.test.ts`, and several page tests use Chinese strings as test inputs to exercise the defensive parsers above.

**Disposition: KEEP-AS-IS** — these are intentional coverage of the Chinese-phrase detectors in (A) and (B). Removing them would silently drop the defensive parser's regression net.

---

## Suggested execution order

1. **(E)** Delete dead `'language.short.zh'` (and any siblings) from `uiText.ts` — 1-line change, no risk.
2. **(B)** De-duplicate ChatPage vs. chatStockCode regexes — local refactor, easy to verify.
3. **(A)** Extract `decisionAction` Chinese-phrase arrays — improves readability; behavior unchanged.
4. **(C)** Fix the `BacktestPage` `.replace(...)` surgery — replace with an API helper from the phase-summary module.
5. **(D)** Add a one-line comment to `api/error.ts` Chinese fallback chains explaining the defensive intent. Optional.

Estimated net effect: ~100 lines of Chinese character data moved out of feature code into clearly-named utility modules, no behavior change, no test churn except the API contract fix in (C).