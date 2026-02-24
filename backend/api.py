import os
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from rag import interroger_base, DOSSIER_STOCKAGE
from llama_index.core import StorageContext, load_index_from_storage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    prompt: str

@app.post("/ask")
async def ask_bot(query: Query):
    reponse = interroger_base(query.prompt)
    # pour simplifier, renvoie une structure vide pour le NER dans cette route
    return {"status": "success", "answer": reponse, "entities_detected": ""}

@app.get("/articles")
async def get_articles():
    """Récupère tous les articles stockés dans l'index."""
    if not os.path.exists(DOSSIER_STOCKAGE):
        return []
    
    storage_context = StorageContext.from_defaults(persist_dir=DOSSIER_STOCKAGE)
    index = load_index_from_storage(storage_context)
    
    # récupere tous les documents du dictionnaire de l'index
    ref_doc_info = index.storage_context.docstore.docs
    
    articles_list = []
    for doc_id, node in ref_doc_info.items():
        articles_list.append({
            "id": doc_id,
            "titre": node.metadata.get("titre", "Sans titre"),
            "date": node.metadata.get("date", "Date inconnue"),
            "source": node.metadata.get("source", "Inconnue"),
            "url": node.metadata.get("url", "#"),
            "contenu": node.text,
            "resume": node.text[:200] + "..." # resume court pour la liste
        })
    
    # Tri par date 
    articles_list.sort(key=lambda x: x['date'], reverse=True)
    return articles_list