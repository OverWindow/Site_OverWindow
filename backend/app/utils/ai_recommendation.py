import json
import os
from typing import Any, Dict

import requests
from dotenv import load_dotenv
from fastapi import HTTPException, status

from app.schemas.ai import DevelopmentRecommendationRequest, DevelopmentRecommendationResponse


load_dotenv()

FACTCHAT_API_URL = os.getenv(
    "FACTCHAT_API_URL",
    "https://factchat-cloud.mindlogic.ai/v1/api/anthropic/messages",
)
FACTCHAT_MODEL = os.getenv("FACTCHAT_MODEL", "claude-sonnet-4-5-20250929")
FACTCHAT_API_KEY = os.getenv("FACTCHAT_API_KEY")
REQUEST_TIMEOUT = 30


def _extract_text_content(data: Dict[str, Any]) -> str:
    content = data.get("content", [])
    if isinstance(content, list):
        texts = [
            item.get("text", "")
            for item in content
            if isinstance(item, dict) and item.get("type") == "text"
        ]
        return "\n".join(texts).strip()
    return ""


def _extract_json_block(text: str) -> Dict[str, Any]:
    cleaned = text.strip()

    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("{") and candidate.endswith("}"):
                return json.loads(candidate)

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or start >= end:
        raise ValueError("JSON object not found in LLM response.")

    return json.loads(cleaned[start : end + 1])


def _build_prompt(payload: DevelopmentRecommendationRequest) -> str:
    additional_context = payload.additional_context.strip() if payload.additional_context else "없음"
    return f"""
당신은 개발 기획을 도와주는 추천 어시스턴트입니다.
아래 개발 아이디어를 보고, 실제 개발에 도움이 되는 웹사이트와 앱을 추천해주세요.

[개발 주제]
{payload.topic}

[원하는 기능]
{payload.features}

[추가 문맥]
{additional_context}

반드시 아래 조건을 지켜주세요.
1. 오직 JSON만 반환하세요. 코드블록 마크다운은 절대 쓰지 마세요.
2. JSON 스키마는 아래와 정확히 같아야 합니다.
{{
  "websites": [
    {{
      "title": "string",
      "url": "https://example.com",
      "description": "짧은 설명"
    }}
  ],
  "apps": [
    {{
      "title": "string",
      "url": "https://example.com",
      "description": "짧은 설명"
    }}
  ],
  "analysis": "너무 길지 않게, 이런 식으로 개발하면 좋을 것 같습니다 수준의 한국어 분석"
}}
3. websites와 apps는 각각 2~5개 정도만 추천하세요.
4. 모든 추천 항목에는 실제로 접근 가능한 URL 형식 문자열을 포함하세요.
5. analysis는 한국어로 2~4문장, 300자 이내로 작성하세요.
6. 불필요한 서론, 결론, 주석, 추가 키는 넣지 마세요.
""".strip()


def get_development_recommendations(
    payload: DevelopmentRecommendationRequest,
) -> DevelopmentRecommendationResponse:
    if not FACTCHAT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FACTCHAT_API_KEY 환경변수가 설정되지 않았습니다.",
        )

    headers = {
        "Authorization": f"Bearer {FACTCHAT_API_KEY}",
        "content-type": "application/json",
    }
    body = {
        "model": FACTCHAT_MODEL,
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": _build_prompt(payload),
            }
        ],
    }

    try:
        response = requests.post(
            FACTCHAT_API_URL,
            headers=headers,
            json=body,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        response_data = response.json()
        text_content = _extract_text_content(response_data)
        parsed = _extract_json_block(text_content)
        return DevelopmentRecommendationResponse.model_validate(parsed)
    except requests.HTTPError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM API 호출에 실패했습니다: {detail}",
        )
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM 응답 JSON 파싱에 실패했습니다: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 추천 생성 중 오류가 발생했습니다: {exc}",
        )
