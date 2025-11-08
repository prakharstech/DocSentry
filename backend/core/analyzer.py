from core.utils import detect_pattern_based
import logging

def hybrid_analysis(text, llm_response):
    """
    Combine pattern-based (regex) and LLM-based sensitive data detections.
    """
    pattern_matches = detect_pattern_based(text)
    combined = {
        "pattern_based": pattern_matches,
        "contextual_analysis": llm_response
    }
    logging.info(f"Hybrid analysis produced {len(pattern_matches)} pattern matches.")
    return combined
