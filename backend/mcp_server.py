import mcp.server.fastmcp as fastmcp
from ner import analyser_texte_cyber
from rag import interroger_base

# Initialisation du serveur MCP 
mcp = fastmcp.FastMCP("VeillePro")

@mcp.tool()
def analyser_texte_tool(texte: str) -> str:
    """Extrait les entités cyber (Logiciels, Organisations, CVE) d'un texte brut."""
    return analyser_texte_cyber(texte)

@mcp.tool()
def rechercher_veille(query: str) -> str:
    """Recherche des informations dans la base locale et extrait automatiquement les entités."""
    reponse_texte = interroger_base(query)
    entites = analyser_texte_cyber(reponse_texte)
    
    return f"--- RÉPONSE ---\n{reponse_texte}\n\n--- ANALYSE NER ---\n{entites}"

if __name__ == "__main__":
    mcp.run()