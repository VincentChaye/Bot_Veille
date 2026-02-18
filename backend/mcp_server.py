import mcp.server.fastmcp as fastmcp
import spacy
from llama_index.core import StorageContext, load_index_from_storage

# Initialisation du serveur MCP 
mcp = fastmcp.FastMCP("VeillePro")

# Chargement du modèle NLP pour l'extraction d'entités nommées (Logiciels, Organisations, CVE) en français
try:
    nlp = spacy.load("fr_core_news_lg")
except:
    import os
    os.system("python -m spacy download fr_core_news_lg")
    nlp = spacy.load("fr_core_news_lg")

@mcp.tool()
def analyser_texte_cyber(texte: str) -> str:
    """Analyse un texte pour extraire les entités nommées (Logiciels, Orgs, CVE)."""
    doc = nlp(texte)
    entities = [f"[{ent.label_}] {ent.text}" for ent in doc.ents]
    return "Entités trouvées : " + ", ".join(entities)

@mcp.tool()
def interroger_veille_locale(query: str) -> str:
    """Recherche des informations dans la base de données de veille locale (RAG)."""
    # On charge l'index précédemment créé et stocké sur le disque
    storage_context = StorageContext.from_defaults(persist_dir="./storage")
    index = load_index_from_storage(storage_context)
    query_engine = index.as_query_engine()
    
    response = query_engine.query(query)
    return str(response)

if __name__ == "__main__":
    mcp.run()