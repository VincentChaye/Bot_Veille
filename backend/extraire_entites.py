import spacy

# Chargement du modèle NLP professionnel
nlp = spacy.load("fr_core_news_lg")

def extraire_entites(texte):
    doc = nlp(texte)
    # On extrait uniquement ce qui nous intéresse pour la cybersécurité
    entites = [(ent.text, ent.label_) for ent in doc.ents]
    return entites

# Exemple d'utilisation
texte_veille = "Une vulnérabilité a été découverte par l'ANSSI sur le serveur Nginx."
print(extraire_entites(texte_veille))
# Sortie attendue : [('ANSSI', 'ORG'), ('Nginx', 'PRODUCT')]