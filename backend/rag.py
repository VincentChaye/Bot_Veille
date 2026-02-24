import os
from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
Settings.llm = None #pas de openIA, penser à conf ollama après
DOSSIER_STOCKAGE = "./storage"


def sauvegarder_documents(documents):
    """Sauvegarde une liste de documents LlamaIndex dans la base vectorielle."""
    if not os.path.exists(DOSSIER_STOCKAGE):
        os.makedirs(DOSSIER_STOCKAGE)
    index = VectorStoreIndex.from_documents(documents)
    index.storage_context.persist(persist_dir=DOSSIER_STOCKAGE)

def interroger_base(query: str) -> str:
    """Interroge la base de données locale (RAG)."""
    if not os.path.exists(DOSSIER_STOCKAGE):
        return "Erreur : La base de données est vide ou inexistante."
        
    storage_context = StorageContext.from_defaults(persist_dir=DOSSIER_STOCKAGE)
    index = load_index_from_storage(storage_context)
    query_engine = index.as_query_engine()
    
    response = query_engine.query(query)
    return str(response)