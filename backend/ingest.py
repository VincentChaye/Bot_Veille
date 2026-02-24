from scraper import CollecteurVeilleMaster
from ner import extraire_entites_liste
from rag import sauvegarder_documents, reinitialiser_stockage
from llama_index.core import Document
from rag import sauvegarder_documents, reinitialiser_stockage, rediger_article_ia

def executer_pipeline_ingestion():
    reinitialiser_stockage()  # ajout pour oplus tard, faire un systeme de articles enregistrer si l'utilisateur est intéressé
    bot = CollecteurVeilleMaster()
    print("Démarrage de la collecte de veille...")
    articles = bot.executer_veille()
    documents_enrichis = []
    
    for art in articles:
        # Extraction NER 
        entites = extraire_entites_liste(art['contenu'])
        metadata_ner = ", ".join([f"{txt} ({label})" for txt, label in entites[:10]])

        # Rédaction IA
        print(f"Rédaction par l'IA en cours : {art.get('titre', 'Article')}...")
        contenu_journalistique = rediger_article_ia(art['contenu'])

        # Formatage pour le RAG
        texte_final = f"TITRE: {art.get('titre')}\nENTITÉS: {metadata_ner}\nCONTENU: {contenu_journalistique}"

        # Création du Document
        doc = Document(
            text=texte_final,
            metadata={
                "source": art.get('source', 'Inconnue'),
                "url": art.get('lien', '#'),
                "categorie": art.get('categorie', 'Veille'),
                "titre": art.get('titre', 'Sans titre'),
                "date": art.get('date', 'Date inconnue')
            }
        )
        documents_enrichis.append(doc)

    # 4. Sauvegarde dans le dossier /storage
    sauvegarder_documents(documents_enrichis)
    print(f"Terminé ! {len(documents_enrichis)} articles ont été traités, enrichis par l'IA et stockés.")

if __name__ == "__main__":
    executer_pipeline_ingestion()