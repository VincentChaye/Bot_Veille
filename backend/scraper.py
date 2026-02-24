import feedparser
import requests
from bs4 import BeautifulSoup
import time

class CollecteurVeilleMaster:
    def __init__(self):
        self.headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        self.sources_rss = {
            "FAILLE": [
                ("CERT-FR", "https://www.cert.ssi.gouv.fr/feed/"),
                ("TheHackerNews", "https://thehackernews.com/rss.xml")
            ],
            "TECH": [
                ("BleepingComputer", "https://www.bleepingcomputer.com/feed/"),
                ("LeJournalDuHacker", "https://www.journalduhacker.net/rss")
            ]
        }

    def scraper_contenu_integral(self, url):
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            for element in soup(['nav', 'footer', 'script', 'style', 'header']):
                element.decompose()
            corps = soup.find('article') or soup.find('main') or soup.body
            return corps.get_text(separator=' ', strip=True)[:3000]
        except:
            return ""

    def collecter_arxiv_api(self):
        url = "http://export.arxiv.org/api/query?search_query=all:cybersecurity&max_results=5"
        feed = feedparser.parse(url)
        return [{
            "titre": e.title,
            "source": "ArXiv",
            "categorie": "SCIENCE",
            "contenu": e.summary,
            "lien": e.link
        } for e in feed.entries]

    def executer_veille(self):
        resultats = []
        resultats.extend(self.collecter_arxiv_api())
        
        for cat, sources in self.sources_rss.items():
            for nom, url in sources:
                feed = feedparser.parse(url)
                for entry in feed.entries[:3]:
                    texte_complet = self.scraper_contenu_integral(entry.link)
                    resultats.append({
                        "titre": entry.title,
                        "source": nom,
                        "categorie": cat,
                        "contenu": texte_complet if len(texte_complet) > 200 else entry.description,
                        "lien": entry.link
                    })
                    time.sleep(1) # Pause anti-bannissement
        return resultats