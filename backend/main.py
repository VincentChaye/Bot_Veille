from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 

class QueryRequest(BaseModel):
    prompt: str

app = FastAPI(title="Bridge Veille Pro")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ne pas oublier de changer lors de la production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ask")
async def ask_bot(request: QueryRequest):
    # simulation d'une reponse tant que le front n'est pas prêt
    return {"status": "success", "answer": f"J'ai bien reçu : {request.prompt}"}

