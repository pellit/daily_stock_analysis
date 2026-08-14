# -*- coding: utf-8 -*-
"""
===================================
API localized labels
===================================

Provides trilingual (zh/en/ko) chrome strings for the FastAPI Swagger
description, health endpoint metadata, and global JSON error responses.

Languages are resolved per request from the ``Accept-Language`` header
with a fallback to English. Use ``set_locale(language)`` to force a
language for the current request (set inside a dependency or middleware).
"""

from __future__ import annotations

import threading
from typing import Dict, Optional

SUPPORTED_LANGUAGES = ("zh", "en", "ko")
DEFAULT_LANGUAGE = "en"

_LABELS: Dict[str, Dict[str, str]] = {
    # ---- Swagger description (api/app.py) ----
    "swagger_description_header": {
        "zh": "A股/港股/美股自选股智能分析系统 API",
        "en": "A-share / Hong Kong / US self-selected stock analysis API",
        "ko": "A주 / 홍콩 / 미국 자가 선정 종목 분석 API",
    },
    "swagger_description_modules": {
        "zh": "## 功能模块",
        "en": "## Modules",
        "ko": "## 기능 모듈",
    },
    "swagger_description_module_analysis": {
        "zh": "- 股票分析：触发 AI 智能分析",
        "en": "- Stock analysis: trigger AI-powered analysis",
        "ko": "- 종목 분석: AI 기반 분석 실행",
    },
    "swagger_description_module_history": {
        "zh": "- 历史记录：查询历史分析报告",
        "en": "- History: query past analysis reports",
        "ko": "- 기록: 과거 분석 보고서 조회",
    },
    "swagger_description_module_market": {
        "zh": "- 股票数据：获取行情数据",
        "en": "- Market data: fetch quotes and fundamentals",
        "ko": "- 시장 데이터: 시세 및 펀더멘털 조회",
    },
    "swagger_description_auth_header": {
        "zh": "## 认证方式",
        "en": "## Authentication",
        "ko": "## 인증",
    },
    "swagger_description_auth_body": {
        "zh": (
            "支持可选管理员认证：ADMIN_AUTH_ENABLED=true 时，除登录、状态、健康检查和 "
            "OpenAPI 文档外，/api/v1/* 需要有效管理员会话 Cookie；关闭时不强制认证。"
        ),
        "en": (
            "Optional admin auth: when ADMIN_AUTH_ENABLED=true, every /api/v1/* path "
            "requires a valid admin session cookie except login, status, health, and "
            "the OpenAPI docs. Authentication is not enforced when the flag is off."
        ),
        "ko": (
            "선택적 관리자 인증: ADMIN_AUTH_ENABLED=true인 경우 로그인, 상태, 헬스 체크 및 "
            "OpenAPI 문서를 제외한 /api/v1/* 경로는 유효한 관리자 세션 쿠키가 필요합니다. "
            "플래그가 꺼져 있으면 인증이 강제되지 않습니다."
        ),
    },

    # ---- Health endpoint metadata ----
    "health_endpoint_summary": {
        "zh": "健康检查",
        "en": "Health check",
        "ko": "헬스 체크",
    },
    "health_endpoint_description": {
        "zh": "用于负载均衡器或监控系统检查服务状态",
        "en": "Reports service health for load balancers and monitoring systems",
        "ko": "로드 밸런서 또는 모니터링 시스템이 서비스 상태를 확인하기 위한 엔드포인트",
    },

    # ---- JSON error responses ----
    "error_internal_with_detail": {
        "zh": "服务器内部错误，请稍后重试",
        "en": "Internal server error. Please try again later.",
        "ko": "서버 내부 오류입니다. 잠시 후 다시 시도해 주세요.",
    },
    "error_internal_short": {
        "zh": "服务器内部错误",
        "en": "Internal server error",
        "ko": "서버 내부 오류",
    },
    "error_validation_failed": {
        "zh": "请求参数验证失败",
        "en": "Request validation failed",
        "ko": "요청 매개변수 검증 실패",
    },
    "error_http_default": {
        "zh": "HTTP Error",
        "en": "HTTP error",
        "ko": "HTTP 오류",
    },
}

# Per-request language slot (replaced by middleware/dependency when available).
_local = threading.local()


def _coerce_language(value: Optional[str]) -> str:
    if not value:
        return DEFAULT_LANGUAGE
    lowered = value.strip().lower()
    for lang in SUPPORTED_LANGUAGES:
        if lowered.startswith(lang):
            return lang
    return DEFAULT_LANGUAGE


def set_locale(language: Optional[str]) -> str:
    """Pin the current thread's language to ``language``. Returns the resolved code."""
    resolved = _coerce_language(language)
    _local.language = resolved
    return resolved


def get_locale() -> str:
    """Return the current request's language, falling back to the default."""
    return getattr(_local, "language", DEFAULT_LANGUAGE) or DEFAULT_LANGUAGE


def resolve_from_accept_language(header_value: Optional[str]) -> str:
    """Best-effort ``Accept-Language`` parser used by the request middleware."""
    if not header_value:
        return DEFAULT_LANGUAGE
    # Pick the highest-q entry that maps to a supported language.
    candidates: list[tuple[float, str]] = []
    for raw_entry in header_value.split(","):
        entry = raw_entry.strip()
        if not entry:
            continue
        parts = entry.split(";", 1)
        tag = parts[0].strip()
        q = 1.0
        if len(parts) > 1:
            for param in parts[1].split(";"):
                param = param.strip()
                if param.startswith("q="):
                    try:
                        q = float(param[2:])
                    except ValueError:
                        q = 1.0
                    break
        candidates.append((q, tag))
    candidates.sort(key=lambda item: item[0], reverse=True)
    for _, tag in candidates:
        resolved = _coerce_language(tag)
        if resolved != DEFAULT_LANGUAGE or tag.lower().startswith("en"):
            return resolved
    return DEFAULT_LANGUAGE


def t(key: str, vars: Optional[Dict[str, str]] = None, language: Optional[str] = None) -> str:
    """Look up a localized string with safe fallbacks."""
    entry = _LABELS.get(key)
    if not entry:
        return key
    lang = _coerce_language(language) if language else get_locale()
    template = entry.get(lang) or entry.get(DEFAULT_LANGUAGE) or entry.get("zh") or key
    if not vars:
        return template
    out = template
    for name, value in vars.items():
        out = out.replace("{" + name + "}", str(value))
    return out


def build_swagger_description(language: Optional[str] = None) -> str:
    """Compose the FastAPI ``description`` block for the active locale."""
    lines = [
        t("swagger_description_header", language=language),
        "",
        t("swagger_description_modules", language=language),
        t("swagger_description_module_analysis", language=language),
        t("swagger_description_module_history", language=language),
        t("swagger_description_module_market", language=language),
        "",
        t("swagger_description_auth_header", language=language),
        t("swagger_description_auth_body", language=language),
    ]
    return "\n".join(lines)


def reset_locale() -> None:
    """Clear the current thread's language. Used by the middleware after each request."""
    if hasattr(_local, "language"):
        delattr(_local, "language")
