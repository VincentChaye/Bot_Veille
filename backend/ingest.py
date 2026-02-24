from scraper import CollecteurVeilleMaster
from ner import extraire_entites_liste
from rag import sauvegarder_documents
from llama_index.core import Document

def executer_pipeline_ingestion():
    bot = CollecteurVeilleMaster()
    print("Démarrage de la collecte de veille...")
    articles = bot.executer_veille()
    documents_enrichis = []
    
    for art in articles:
        # 1. Extraction des entités via spaCy
        entites = extraire_entites_liste(art['contenu'])
        metadata_ner = ", ".join([f"{txt} ({label})" for txt, label in entites[:10]])
        
        # 2. Formatage du texte pour le RAG
        texte_final = f"TITRE: {art['titre']}\nENTITÉS: {metadata_ner}\nCONTENU: {art['contenu']}"
        
        # 3. Création de l'objet LlamaIndex
        doc = Document(
            text=texte_final,
            metadata={
                "source": art['source'],
                "url": art['lien'],
                "categorie": art['categorie']
            }
        )
        documents_enrichis.append(doc)

    # 4. Sauvegarde dans le dossier /storage
    sauvegarder_documents(documents_enrichis)
    print(f"Terminé ! {len(documents_enrichis)} articles ont été traités, enrichis par l'IA et stockés.")

if __name__ == "__main__":
    executer_pipeline_ingestion()