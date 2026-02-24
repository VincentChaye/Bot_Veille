from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 
from rag import interroger_base
from ner import analyser_texte_cyber

app = FastAPI(title="Bridge Veille Pro")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Si j'oublie de restreindre je suis débile, mais pour le dev c'est plus simple
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    prompt: str

@app.post("/ask")
async def ask_bot(request: QueryRequest):
    # 1. Recherche dans la base LlamaIndex
    connaissance = interroger_base(request.prompt)
    
    # 2. Analyse des entités présentes dans la réponse
    entites = analyser_texte_cyber(connaissance)
    
    return {
        "status": "success",
        "answer": connaissance,
        "entities_detected": entites
    }