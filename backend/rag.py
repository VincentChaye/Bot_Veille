import os
from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import shutil
from llama_index.llms.ollama import Ollama

Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
Settings.llm = Ollama(model="mistral", request_timeout=120.0)

DOSSIER_STOCKAGE = "./storage"

def reinitialiser_stockage():
    """Supprime l'ancien dossier de stockage pour repartir à zéro."""
    if os.path.exists(DOSSIER_STOCKAGE):
        shutil.rmtree(DOSSIER_STOCKAGE)
        print(f"Ancienne base de données '{DOSSIER_STOCKAGE}' supprimée.")

def sauvegarder_documents(documents):
    """Sauvegarde une liste de documents LlamaIndex dans la base vectorielle."""
    if not os.path.exists(DOSSIER_STOCKAGE):
        os.makedirs(DOSSIER_STOCKAGE)
    index = VectorStoreIndex.from_documents(documents)
    index.storage_context.persist(persist_dir=DOSSIER_STOCKAGE)

def interroger_base(query: str) -> str:
    """Cherche dans la base locale et renvoie un texte propre, sans prompt anglais."""
    if not os.path.exists(DOSSIER_STOCKAGE):
        return "Erreur : La base de données est vide ou inexistante."
        
    storage_context = StorageContext.from_defaults(persist_dir=DOSSIER_STOCKAGE)
    index = load_index_from_storage(storage_context)
    query_engine = index.as_query_engine(
        similarity_top_k=2
    )
    response = query_engine.query(query)
    return str(response)

def rediger_article_ia(texte_brut: str) -> str:
    """Demande à Ollama de réécrire le texte brut comme un journaliste expert, en ANGLAIS."""
    prompt = f"""You are an expert cybersecurity journalist. 
    Your objective is to transform the raw security bulletin below into a clear, punchy, and professional threat intelligence article.
    
    CRITICAL: Your entire output MUST be written in ENGLISH, even if the source text is in French or another language.
    
    Rules:
    1. Remove all administrative jargon (reference numbers, version history, etc.).
    2. Write a catchy introductory summary (2-3 sentences max).
    3. Structure the rest using exactly these markdown titles: 
       ### Context and Risks
       ### Affected Systems
       ### Recommendations
    4. Keep it factual, precise, and preserve all CVE numbers.
    
    Raw text to transform:
    {texte_brut[:2000]}
    """
    
    response = Settings.llm.complete(prompt)
    return str(response)