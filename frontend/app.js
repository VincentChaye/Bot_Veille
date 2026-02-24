const API_URL = "http://127.0.0.1:8000/ask";

// interface
const initApp = () => {
    const app = document.getElementById('app');
    app.innerHTML = `
        <header class="p-6 border-b border-white/10 flex justify-between items-center glass neon-shadow">
            <div class="flex items-center gap-3">
                <div class="bg-sky-500 p-2 rounded-lg shadow-lg">
                    <i class="fas fa-user-secret text-white text-xl"></i>
                </div>
                <h1 class="text-2xl font-bold tracking-tighter">Veille<span class="text-sky-400">Pro</span></h1>
            </div>
            <div id="statusIndicator" class="text-xs text-emerald-400 flex items-center gap-2">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                SYSTÈME PRÊT
            </div>
        </header>

        <main class="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div class="lg:col-span-3 space-y-8">
                <div class="glass rounded-3xl p-8 card-anim">
                    <h2 class="text-sm font-semibold text-sky-400 uppercase tracking-widest mb-6">Centre de Commandement</h2>
                    <div class="flex gap-4">
                        <input type="text" id="queryInput" 
                            class="flex-1 bg-slate-900/80 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all text-lg"
                            placeholder="Entrez votre requête de veille...">
                        <button id="submitBtn" class="bg-sky-500 hover:bg-sky-600 text-white px-8 rounded-2xl font-bold transition-all flex items-center gap-3">
                            <span>ANALYSER</span>
                            <i class="fas fa-bolt"></i>
                        </button>
                    </div>
                </div>

                <div id="resultsArea" class="hidden space-y-6">
                    </div>
            </div>

            <div class="space-y-6">
                <div class="glass rounded-3xl p-6">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-4 tracking-tighter">Flux d'entités (NER)</h3>
                    <div id="entityBox" class="flex flex-wrap gap-2">
                        <p class="text-slate-500 text-xs italic">Aucune donnée traitée.</p>
                    </div>
                </div>
            </div>
        </main>
    `;

    document.getElementById('submitBtn').addEventListener('click', handleSearch);
    document.getElementById('queryInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
};

// Gestion de la recherche
async function handleSearch() {
    const input = document.getElementById('queryInput');
    const resultsArea = document.getElementById('resultsArea');
    const entityBox = document.getElementById('entityBox');
    const btn = document.getElementById('submitBtn');

    if (!input.value.trim()) return;

    // État de chargement
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`;
    resultsArea.classList.remove('hidden');
    resultsArea.innerHTML = `
        <div class="glass rounded-3xl p-8 animate-pulse text-center text-slate-400">
            <i class="fas fa-brain text-4xl mb-4 text-sky-500"></i>
            <p>Ollama Mistral analyse la base de connaissances...</p>
        </div>
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: input.value })
        });

        const data = await response.json();

        // Affichage dynamique de la réponse
        resultsArea.innerHTML = `
            <div class="glass rounded-3xl p-8 card-anim border-l-4 border-sky-500">
                <div class="flex justify-between items-start mb-6">
                    <span class="bg-sky-500/10 text-sky-400 text-xs font-bold px-3 py-1 rounded-full">RÉSULTAT GÉNÉRÉ</span>
                    <span class="text-slate-500 text-xs">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="prose prose-invert max-w-none text-slate-300 leading-relaxed text-lg">
                    ${data.answer.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;

        // Traitement des entités (Badges)
        if (data.entities_detected && data.entities_detected.includes("Entités trouvées :")) {
            const list = data.entities_detected.replace("Entités trouvées : ", "").split(", ");
            entityBox.innerHTML = list.map(ent => createBadge(ent)).join('');
        }

    } catch (err) {
        resultsArea.innerHTML = `<div class="p-8 bg-red-500/10 text-red-400 rounded-3xl border border-red-500/20">Erreur de connexion avec l'API.</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>ANALYSER</span><i class="fas fa-bolt"></i>`;
    }
}

// Helper pour les badges NER
function createBadge(text) {
    let style = "bg-slate-800 text-slate-300 border-slate-700";
    if (text.includes("CVE")) style = "bg-red-500/10 text-red-400 border-red-500/20";
    if (text.includes("ORG")) style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (text.includes("PRODUCT")) style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    
    return `<span class="px-3 py-1 border rounded-lg text-[10px] font-bold uppercase ${style}">${text}</span>`;
}

// Lancement au chargement du DOM
document.addEventListener('DOMContentLoaded', initApp);