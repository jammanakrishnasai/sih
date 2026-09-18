"""
Input-language detection + fallback query normalization.

This is the missing piece in the pipeline: previously `language` on
AnalyzeRequest only controlled *output* translation. The query text itself
was passed straight into classify()/route_areas()/retrieve(), all of which
only understand English keywords/tokens. For a Telugu query that meant a
guaranteed zero-relevance retrieval (see retrieval.py docstring for the
mechanism), regardless of how good the underlying corpus match actually was.

detect_language() looks at the query text itself (Unicode script), not a
UI toggle or browser locale, per the "use the actual query text" requirement.

fallback_normalize() is a small, explicit second line of defense: if the real
translator (translate.translate_to_english) is unavailable or fails, we still
want *some* English signal for retrieval rather than silently returning
nothing. It is intentionally tiny and is never used to author legal claims —
only to help the TF-IDF retriever match on domain terms.
"""
import re

_TELUGU_RANGE = re.compile(r"[\u0C00-\u0C7F]")
_TAMIL_RANGE = re.compile(r"[\u0B80-\u0BFF]")
_MALAYALAM_RANGE = re.compile(r"[\u0D00-\u0D7F]")
_DEVANAGARI_RANGE = re.compile(r"[\u0900-\u097F]")

# Sanskrit markers within Devanagari text
_SANSKRIT_WORDS = {
    "अस्य", "तस्य", "कस्य", "किम्", "इति", "शक्यते", "भवति", "अस्ति",
    "प्राप्तुम्", "प्राप्तुं", "तथा", "च", "अपि", "एव", "तु", "कथम्",
    "कुत्र", "कदा", "सर्वम्", "शास्त्रम्", "विधानम्", "वा", "ते", "एतत्",
    "यत्", "तत्", "उत्पादस्य", "अधिकारस्य", "ग्रन्थस्य", "पेटेण्ट्"
}
_SANSKRIT_SUFFIX_PATTERN = re.compile(r"\b\w+स्य\b|\b\w+तुम्\b|\b\w+तुं\b|\b\w+ः\b")


def is_sanskrit_devanagari(text: str) -> bool:
    """Check whether Devanagari text is Sanskrit rather than Hindi using word & suffix heuristics."""
    words = re.findall(r"[\u0900-\u097F]+", text)
    if any(w in _SANSKRIT_WORDS for w in words):
        return True
    if _SANSKRIT_SUFFIX_PATTERN.search(text):
        return True
    return False


def detect_language(text: str) -> str:
    """Detect input language from the query text itself.

    Supports:
      - English ('en')
      - Telugu ('te') via Telugu Unicode script
      - Tamil ('ta') via Tamil Unicode script
      - Malayalam ('ml') via Malayalam Unicode script
      - Hindi ('hi') via Devanagari script (default when no Sanskrit markers found)
      - Sanskrit ('sa') via Devanagari script + Sanskrit word/suffix heuristic
    """
    if not text:
        return "en"
    if _TAMIL_RANGE.search(text):
        return "ta"
    if _MALAYALAM_RANGE.search(text):
        return "ml"
    if _TELUGU_RANGE.search(text):
        return "te"
    if _DEVANAGARI_RANGE.search(text):
        if is_sanskrit_devanagari(text):
            return "sa"
        return "hi"
    return "en"


# Small, explicit term glossary — used ONLY as a fallback normalization
# strategy when live translation is unavailable (see main.py). NOT a
# replacement for real translation, and NOT applied to the corpus or to
# anything shown to the user.
TELUGU_TERM_MAP = {
    "పేటెంట్": "patent",
    "సాంప్రదాయ జ్ఞానం": "traditional knowledge",
    "ఆయుర్వేదం": "Ayurveda",
    "ఆయుర్వేద": "Ayurvedic",
    "శాస్త్రీయ": "classical",
    "ఫార్ములేషన్": "formulation",
    "జీవ వనరులు": "biological resources",
    "ప్రయోజన భాగస్వామ్యం": "access and benefit sharing",
    "గ్రంథం": "text",
    "సంప్రదాయ": "traditional",
    "ఉత్పత్తికి": "product",
    "పొందవచ్చా": "can be obtained",
}

HINDI_TERM_MAP = {
    "पेटेंट": "patent",
    "पारंपरिक ज्ञान": "traditional knowledge",
    "आयुर्वेदिक": "Ayurvedic",
    "आयुर्वेद": "Ayurveda",
    "शास्त्रीय": "classical",
    "फॉर्मूलेशन": "formulation",
    "जैविक संसाधन": "biological resources",
    "लाभ साझा करना": "access and benefit sharing",
    "ग्रंथ": "text",
    "पारंपरिक": "traditional",
    "उत्पाद": "product",
    "प्राप्त किया जा सकता": "can be obtained",
}

TAMIL_TERM_MAP = {
    "காப்புரிமை": "patent",
    "பாரம்பரிய அறிவு": "traditional knowledge",
    "ஆயுர்வேத": "Ayurvedic",
    "ஆயுர்வேதம்": "Ayurveda",
    "செம்மொழி": "classical",
    "தயாரிப்பு": "formulation",
    "தயாரிப்புக்கு": "product",
    "உயிரியல் வளங்கள்": "biological resources",
    "பயன் பகிர்வு": "access and benefit sharing",
    "நூல்": "text",
    "பாரம்பரிய": "traditional",
    "பெற முடியுமா": "can be obtained",
}

MALAYALAM_TERM_MAP = {
    "പേറ്റന്റ്": "patent",
    "പാരമ്പര്യ അറിവ്": "traditional knowledge",
    "ആയുർവേദ": "Ayurvedic",
    "ആയുർവേദം": "Ayurveda",
    "ക്ലാസിക്കൽ": "classical",
    "ഉൽപ്പന്നം": "formulation",
    "ഉൽപ്പന്നത്തിന്": "product",
    "ജൈവ വിഭവങ്ങൾ": "biological resources",
    "ലാഭ വിഹിതം": "access and benefit sharing",
    "ഗ്രന്ഥം": "text",
    "പാരമ്പര്യ": "traditional",
    "ലഭിക്കുമോ": "can be obtained",
}

SANSKRIT_TERM_MAP = {
    "पेटेण्ट्": "patent",
    "पेटेंट": "patent",
    "पारम्परिकज्ञानम्": "traditional knowledge",
    "पारम्परिक ज्ञानम्": "traditional knowledge",
    "आयुर्वेदिक": "Ayurvedic",
    "आयुर्वेद": "Ayurveda",
    "शास्त्रीय": "classical",
    "उत्पादस्य": "product",
    "उत्पाद": "product",
    "जैविकसंसाधनानि": "biological resources",
    "लाभसहभागिता": "access and benefit sharing",
    "ग्रन्थः": "text",
    "पारम्परिक": "traditional",
    "प्राप्तुं शक्यते किम्": "can be obtained",
    "शक्यते": "can be",
}


def fallback_normalize(text: str) -> str:
    """Best-effort English gloss built by substring term substitution.

    Used only when the real translator call fails/is offline. Strips any
    remaining non-Latin characters afterward so leftover native text can't
    silently zero out the TF-IDF tokenizer again.
    """
    out = text
    for term_map in (TELUGU_TERM_MAP, HINDI_TERM_MAP, TAMIL_TERM_MAP, MALAYALAM_TERM_MAP, SANSKRIT_TERM_MAP):
        for source_term, en_term in term_map.items():
            out = out.replace(source_term, f" {en_term} ")
    out = re.sub(r"[^\x00-\x7F]+", " ", out)
    return re.sub(r"\s+", " ", out).strip()

