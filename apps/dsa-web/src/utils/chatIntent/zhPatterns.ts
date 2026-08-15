/**
 * Defensive Chinese-intent regexes for chat messages.
 *
 * Active only when the user's input contains Chinese tokens (e.g. "换成",
 * "比较"). Used both to detect stock-context (so a bare lowercase ticker
 * isn't mistaken for a non-ticker word) and to disambiguate intent
 * (compare vs switch vs choose). The English UI does not consult these
 * for its own copy; they exist to keep the agent's free-text parser
 * honest for users who type in Chinese.
 */

/** Strong compare signal: 比较 / 对比 / vs / 和…比 */
export const STRONG_COMPARE_STOCK_MESSAGE_RE = /比较|对比|\bvs\b|和[^，。,.!?！？]{0,40}比/i;

/** Weak compare signal: 差异 / 区别 / 不同 / 相比 / 对照 / 比一比 */
export const WEAK_COMPARE_STOCK_MESSAGE_RE = /差异(?!化)|区别|不同|相比|对照|比一比/;

/** Choice compare signal: 哪个 / 哪只 / 谁更 / 怎么选 / 二选一 */
export const CHOICE_COMPARE_STOCK_MESSAGE_RE = /哪个|哪只|哪一个|谁更|更值得|更适合|怎么选|选哪|二选一/;

/** Linked compare signal: 和 / 与 / 跟 / 同 followed by a weak-compare phrase */
export const LINKED_COMPARE_STOCK_MESSAGE_RE = /(?:和|与|跟|同)[^，。,.!?！？]{0,40}(?:差异(?!化)|区别|不同|相比|对照|比一比)/;

/** Switch signal: 换成 / 改看 / 分析 / 看看 / 研究 / 诊断 */
export const SWITCH_STOCK_MESSAGE_RE = /换成|改看|分析|看看|研究|诊断/;

/**
 * Union of every Chinese compare/switch/choice intent above; consumed by
 * `chatStockCode.ts` to widen the lowercase-ticker pattern when a Chinese
 * intent is present (so a bare "tsmc" can still be picked up after
 * "比较 tsmc 和 中芯国际").
 */
export const LOWERCASE_TICKER_CONTEXT_RE = /换成|改看|分析|看看|研究|诊断|比较|对比|\bvs\b|和[^，。,.!?！？]{0,40}比|差异(?!化)|区别|不同|相比|对照|比一比|哪个|哪只|哪一个|谁更|更值得|更适合|怎么选|选哪|二选一/i;

/** Chinese indicator-context tokens: 指标 / 均线 / 金叉 / etc., plus Latin MA/SMA/EMA suffixes */
export const INDICATOR_CONTEXT_RE = /指标|均线|移动平均|排列|多头|空头|金叉|死叉|支撑|压力|MA\d|SMA|EMA/i;
