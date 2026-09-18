"""
Automated multilingual-equivalence tests (brief sections 13-14).

Real machine translation (deep-translator -> Google Translate) needs live
internet access, which may not be available in CI/sandboxed environments.
So these tests exercise the pipeline the way it actually behaves offline:
via the fallback normalization path (language.fallback_normalize), which is
the same code path main.py falls back to when translate_to_english() fails.
This keeps the tests deterministic while still proving the real bug is
fixed: a Telugu-script query must retrieve the same authoritative evidence
as its English equivalent, and unsupported queries must still abstain.

If real translation is available (network + deep-translator working), the
`test_live_translation_path` test additionally exercises the real
translate_to_english() call; it is skipped (not failed) if that call can't
reach the network, since this prototype must fail safe rather than fail the
build when offline.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import classifier, jurisdiction, retrieval, confidence, language, query_expansion, translate  # noqa: E402

EN_QUERY = "Can this Ayurvedic formulation be patented?"
TE_QUERY = "ఈ ఆయుర్వేద ఉత్పత్తికి పేటెంట్ పొందవచ్చా?"
HI_QUERY = "क्या इस आयुर्वेदिक उत्पाद का पेटेंट प्राप्त किया जा सकता है?"
TA_QUERY = "இந்த ஆயுர்வேத தயாரிப்புக்கு காப்புரிமை பெற முடியுமா?"
ML_QUERY = "ഈ ആയുർവേദ ഉൽപ്പന്നത്തിന് പേറ്റന്റ് ലഭിക്കുമോ?"
SA_QUERY = "अस्य आयुर्वेदिक-उत्पादस्य पेटेण्ट् प्राप्तुं शक्यते किम्?"

UNSUPPORTED_QUERY = "What is the boiling point of tungsten?"


def _run_pipeline(retrieval_query: str, jurisdiction_name: str = "India"):
    """Mirrors the main.py /api/analyze pipeline for a given (English)
    retrieval query, without going through FastAPI/HTTP."""
    classification = classifier.classify(retrieval_query)
    areas = jurisdiction.route_areas(retrieval_query, classification.category)
    variants = query_expansion.expand_query(retrieval_query)
    retrieved = retrieval.retrieve(variants, jurisdiction_name, areas, top_k=5)
    conf_score, conf_label, _ = confidence.score(retrieved, classification.confidence)
    abstained = confidence.should_abstain(conf_score, retrieved)
    return classification, areas, retrieved, conf_score, abstained


def test_language_detection():
    assert language.detect_language(EN_QUERY) == "en"
    assert language.detect_language(TE_QUERY) == "te"
    assert language.detect_language(HI_QUERY) == "hi"
    assert language.detect_language(TA_QUERY) == "ta"
    assert language.detect_language(ML_QUERY) == "ml"
    assert language.detect_language(SA_QUERY) == "sa"


def test_english_query_retrieves_evidence_and_does_not_abstain():
    classification, areas, retrieved, conf_score, abstained = _run_pipeline(EN_QUERY)
    assert classification.category in ("Classical / Generic Medicine", "Patent / Proprietary Medicine", "New / Non-Classical Drug", "Phytopharmaceutical")
    assert "Patents" in areas
    assert len(retrieved) > 0
    assert not abstained


def test_multilingual_fallback_normalization_retrieves_same_evidence():
    classification_en, areas_en, retrieved_en, _, abstained_en = _run_pipeline(EN_QUERY)
    assert not abstained_en

    for query, expected_lang in [(TE_QUERY, "te"), (HI_QUERY, "hi"), (TA_QUERY, "ta"), (ML_QUERY, "ml"), (SA_QUERY, "sa")]:
        normalized = language.fallback_normalize(query)
        assert normalized.strip(), f"fallback normalization for {expected_lang} must not return empty text"
        classification_lang, areas_lang, retrieved_lang, _, abstained_lang = _run_pipeline(normalized)

        assert not abstained_lang, f"{expected_lang}-equivalent query must not abstain when English does not"
        assert classification_lang.category == classification_en.category
        assert set(areas_lang) & set(areas_en), f"expected overlapping applicable areas for {expected_lang}"

        ids_en = {s["id"] for s in retrieved_en}
        ids_lang = {s["id"] for s in retrieved_lang}
        overlap = ids_en & ids_lang
        assert len(overlap) >= 1, f"expected overlapping sources for {expected_lang}, got EN={ids_en} {expected_lang.upper()}={ids_lang}"


def test_unsupported_query_still_abstains():
    """Proves retrieval was improved without disabling safe abstention."""
    _, _, retrieved, _, abstained = _run_pipeline(UNSUPPORTED_QUERY)
    assert abstained


def test_raw_native_text_without_normalization_would_fail_lexical_match():
    areas = jurisdiction._CATEGORY_DEFAULT_AREAS["Classical / Generic Medicine"]
    retrieved_raw = retrieval.retrieve(TE_QUERY, "India", areas, top_k=5)
    assert retrieved_raw == []


def test_live_translation_path():
    """Best-effort check of the real translator; skipped if offline."""
    translated, ok = translate.translate_to_english(TE_QUERY, "te")
    if not ok:
        import pytest
        pytest.skip("live translation service unavailable in this environment")
    assert translated.strip()
    classification, areas, retrieved, _, abstained = _run_pipeline(translated)
    assert not abstained

