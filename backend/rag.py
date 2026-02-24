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
    """Demande à Ollama de réécrire le texte brut comme un journaliste expert."""
    prompt = f"""Tu es un journaliste expert en cybersécurité. 
    Ton objectif est de transformer le bulletin de sécurité brut ci-dessous en un article de veille clair, percutant et professionnel.
    
    Règles :
    1. Supprime tout le jargon administratif (numéro de référence, "Affaire suivie par", historique des versions).
    2. Fais un résumé d'introduction accrocheur (2-3 phrases max).
    3. Structure la suite avec ces titres exacts (en markdown) : 
       ### Contexte et Risques
       ### Systèmes affectés
       ### Recommandations
    4. Reste factuel, précis et garde les numéros CVE.
    
    Texte brut à transformer :
    {texte_brut[:2000]} # On limite un peu la taille pour que l'IA réponde vite
    """
    
    # On demande à Ollama de générer le texte
    response = Settings.llm.complete(prompt)
    return str(response)