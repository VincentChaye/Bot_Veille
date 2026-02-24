import spacy
from spacy.language import Language
import os
import re

# Chargement du modèle NLP
try:
    nlp = spacy.load("fr_core_news_lg")
except OSError:
    os.system("python -m spacy download fr_core_news_lg")
    nlp = spacy.load("fr_core_news_lg")

@Language.component("cve_detector")
def cve_detector(doc):
    pattern = r"CVE-\d{4}-\d{4,7}"
    for match in re.finditer(pattern, doc.text):
        start, end = match.span()
        span = doc.char_span(start, end, label="CVE")
        if span is not None:
            existing_ents = list(doc.ents)
            if not any(ent.start <= span.start < ent.end for ent in existing_ents):
                doc.ents = existing_ents + [span]
    return doc

if "cve_detector" not in nlp.pipe_names:
    nlp.add_pipe("cve_detector", before="ner")

def analyser_texte_cyber(texte: str) -> str:
    """Renvoie une chaîne formatée des entités pour l'API et MCP."""
    doc = nlp(texte)
    labels_interet = ["ORG", "PRODUCT", "CVE", "LOC"]
    entities = [f"[{ent.label_}] {ent.text}" for ent in doc.ents if ent.label_ in labels_interet]
    
    if not entities:
        return "Aucune entité cyber spécifique détectée."
    return "Entités trouvées : " + ", ".join(set(entities))

def extraire_entites_liste(texte: str) -> list:
    """Renvoie une liste brute d'entités (utile pour l'ingestion)."""
    doc = nlp(texte)
    labels_interet = ["ORG", "PRODUCT", "CVE", "LOC"]
    return [(ent.text, ent.label_) for ent in doc.ents if ent.label_ in labels_interet]