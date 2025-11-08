import logging, re

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# Basic patterns for sensitive info detection
SENSITIVE_PATTERNS = {
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "credit_card/debit_card": r"\b(?:\d[ -]*?){13,16}\b",
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
    "phone": r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b",
    "jwt_token": r"\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b",
    "ip_address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
}

def detect_pattern_based(text):
    """Detect basic sensitive patterns via regex."""
    matches = []
    for label, pattern in SENSITIVE_PATTERNS.items():
        for match in re.findall(pattern, text):
            matches.append({"type": label, "value": match})
    return matches
