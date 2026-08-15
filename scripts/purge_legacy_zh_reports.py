"""One-shot maintenance script: purge cached Chinese-language market-review
records from the ``analysis_history`` table.

These rows are LLM outputs that pre-date the i18n refactor (UiLanguage type-
locked to 'en', X-UI-Language header forwarding, report_language='en' default).
They contain a ``name`` and a ``raw_result`` / ``context_snapshot`` blob full
of CJK characters, so the Market Review card on Home / Settings / drawer
renders them as Chinese even though new generations are English.

The canonical fix is to regenerate the reports. This script is a pragmatic
cleanup for the legacy rows so the user-facing UI stops surfacing Chinese
content from cache.

Usage:

    # 1) Dry-run (default) -- prints what would be deleted, no changes.
    python scripts/purge_legacy_zh_reports.py

    # 2) Apply deletions.
    python scripts/purge_legacy_zh_reports.py --apply

    # 3) Also wipe non-market-review reports that have a Chinese ``name``
    #    (rare; only stale stock-name records).
    python scripts/purge_legacy_zh_reports.py --apply --include-stocks

Safety: only deletes rows whose ``name`` or any of the text columns contains
CJK Unified Ideographs. Rows without CJK are left untouched, so legitimately
English records (including the post-deploy English runs) are preserved.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy import select  # noqa: E402

from src.storage import AnalysisHistory, get_engine, get_session_factory  # noqa: E402

CJK_RE = __import__("re").compile(r"[一-鿿]")


def has_cjk(value):
    return bool(value and CJK_RE.search(value))


def find_legacy_zh_records(session, include_stocks: bool):
    stmt = select(AnalysisHistory)
    rows = session.execute(stmt).scalars().all()
    legacy = []
    for row in rows:
        is_market_review = (row.report_type or "") == "market_review"
        is_stock = (row.code or "") != "MARKET" and (row.report_type or "") != "market_review"
        if is_market_review:
            if has_cjk(row.name) or has_cjk(row.raw_result) or has_cjk(row.context_snapshot):
                legacy.append(row)
        elif include_stocks and is_stock:
            if has_cjk(row.name):
                legacy.append(row)
    return legacy


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually delete the matching rows. Without this flag the script is a dry-run.",
    )
    parser.add_argument(
        "--include-stocks",
        action="store_true",
        help="Also delete non-market-review rows with a CJK stock_name (rare; defaults to off).",
    )
    args = parser.parse_args()

    engine = get_engine()
    SessionLocal = get_session_factory(engine)
    with SessionLocal() as session:
        legacy = find_legacy_zh_records(session, include_stocks=args.include_stocks)

        print(f"Found {len(legacy)} legacy Chinese record(s) "
              f"(include_stocks={args.include_stocks}).")
        for row in legacy:
            created = row.created_at.isoformat() if row.created_at else "?"
            print(f"  - id={row.id} code={row.code!r} name={row.name!r} "
                  f"report_type={row.report_type!r} created_at={created}")

        if not args.apply:
            print("\nDry-run only. Re-run with --apply to delete.")
            return

        if not legacy:
            return

        ids = [row.id for row in legacy]
        for row in legacy:
            session.delete(row)
        session.commit()
        print(f"\nDeleted {len(ids)} record(s) at {datetime.now().isoformat(timespec='seconds')}.")
        print("Recommendation: trigger a fresh 'Market review' from the Home page "
              "so the user-facing UI shows an English report.")


if __name__ == "__main__":
    main()
