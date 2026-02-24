const API_URL = "http://127.0.0.1:8000";
let allArticles = [];

// --- FONCTIONS UTILITAIRES ---

function formatSmartDate(dateStr) {
    if (!dateStr || dateStr === "Date inconnue") return dateStr;
    if (dateStr.includes("00:00:00")) {
        return dateStr.split("00:00:00")[0].trim();
    }
    return dateStr;
}

function detecterNotionsComplexes(texte) {
    const t = texte.toLowerCase();
    const tags = new Set();

    if (t.includes("rce") || t.includes("remote code execution") || t.includes("exploit") || t.includes("cve-20")) tags.add("Exploitation");
    if (t.includes("credentials") || t.includes("password") || t.includes("auth") || t.includes("identity")) tags.add("IAM & Identité");
    if (t.includes("malware") || t.includes("ransomware") || t.includes("spyware") || t.includes("stealer")) tags.add("Malware");
    if (t.includes("patched") || t.includes("mitigation") || t.includes("remediation") || t.includes("fix")) tags.add("Blue Team");
    if (t.includes("bypass") || t.includes("injection") || t.includes("spoofing") || t.includes("attack")) tags.add("Red Team");
    if (t.includes("windows") || t.includes("active directory") || t.includes("microsoft")) tags.add("Windows");
    if (t.includes("linux") || t.includes("unix") || t.includes("debian") || t.includes("ubuntu")) tags.add("Linux");
    if (t.includes("cloud") || t.includes("azure") || t.includes("aws") || t.includes("s3")) tags.add("Cloud Security");
    if (t.includes("network") || t.includes("protocol") || t.includes("tcp") || t.includes("dns")) tags.add("Réseau");

    return tags.size > 0 ? Array.from(tags) : ["Veille"];
}

function getStyleNotion(n) {
    const map = {
        "Red Team": "bg-red-500/10 border-red-500/30 text-red-400",
        "Blue Team": "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        "Exploitation": "bg-amber-500/10 border-amber-500/30 text-amber-400",
        "Malware": "bg-purple-500/10 border-purple-500/30 text-purple-400",
        "Windows": "bg-blue-500/10 border-blue-500/30 text-blue-300",
        "Linux": "bg-orange-500/10 border-orange-500/30 text-orange-300"
    };
    return map[n] || "bg-sky-500/10 border-sky-500/30 text-sky-400";
}

// --- LOGIQUE DE L'APPLICATION ---

const initApp = async () => {
    const app = document.getElementById('app');
    app.innerHTML = `
        <header class="p-6 border-b border-white/10 flex justify-between items-center glass sticky top-0 z-50">
            <div class="flex items-center gap-3 cursor-pointer" onclick="renderListView()">
                <div class="bg-sky-500 p-2 rounded-lg shadow-lg">
                    <i class="fas fa-shield-alt text-white"></i>
                </div>
                <h1 class="text-xl font-bold tracking-tight">Cyber<span class="text-sky-400">Watch</span></h1>
            </div>
            <div class="flex gap-4">
                <input type="text" id="mainSearch" placeholder="Filtrer les articles..." class="bg-slate-900 border border-white/10 rounded-lg px-4 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
            </div>
        </header>
        <div id="mainContent" class="max-w-5xl mx-auto p-6"></div>
    `;
    
    await fetchArticles();
    renderListView();
};

async function fetchArticles() {
    try {
        const res = await fetch(`${API_URL}/articles`);
        allArticles = await res.json();
    } catch (e) { 
        console.error("Erreur API", e);
    }
}

function renderListView() {
    const container = document.getElementById('mainContent');
    if (allArticles.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-center py-20 italic">Aucune donnée disponible.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-bold flex items-center gap-3 text-white">
                <i class="fas fa-layer-group text-sky-500"></i> Flux de Veille
            </h2>
            <span class="text-xs text-slate-500 font-mono">${allArticles.length} articles chargés</span>
        </div>
        <div class="grid gap-4">
            ${allArticles.map(art => `
                <div onclick="renderDetailView('${art.id}')" class="glass p-5 rounded-xl cursor-pointer border border-white/5 hover:border-sky-500/40 transition-all group">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-black text-sky-500 uppercase tracking-widest">${art.source}</span>
                        <span class="text-[10px] text-slate-500 font-mono">${formatSmartDate(art.date)}</span>
                    </div>
                    <h3 class="text-lg font-bold group-hover:text-sky-400 transition-colors mb-2">${art.titre}</h3>
                    <p class="text-slate-400 text-xs leading-relaxed line-clamp-2">${art.resume}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDetailView(id) {
    const art = allArticles.find(a => a.id === id);
    if (!art) return;

    const notions = detecterNotionsComplexes(art.contenu + art.titre);
    
    // Extraction propre du contenu (on retire les prefixes techniques injectés dans ingest.py)
    const entitesPart = art.contenu.match(/ENTITÉS:(.*?)CONTENU:/s)?.[1] || "Analyse en cours...";
    const corpsPur = art.contenu.split("CONTENU:")[1] || art.contenu;

    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <button onclick="renderListView()" class="mb-8 text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-tighter">
            <i class="fas fa-chevron-left"></i> Retour au flux
        </button>
        
        <article class="glass rounded-3xl overflow-hidden animate-fade-in border border-white/10 shadow-2xl">
            <header class="p-8 lg:p-12 bg-gradient-to-br from-slate-900 to-sky-900/20 border-b border-white/5">
                <div class="flex items-center gap-4 text-xs font-bold mb-6">
                    <span class="bg-sky-500 text-white px-3 py-1 rounded">${art.source}</span>
                    <span class="text-slate-400">${formatSmartDate(art.date)}</span>
                </div>
                <h1 class="text-3xl lg:text-5xl font-black text-white mb-8 leading-tight">${art.titre}</h1>
                <a href="${art.url}" target="_blank" class="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 text-xs font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10 transition-all">
                    LIEN SOURCE <i class="fas fa-external-link-alt"></i>
                </a>
            </header>

            <div class="p-8 lg:p-12 space-y-12">
                <section class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div class="lg:col-span-1">
                        <h3 class="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2">Extraction NER</h3>
                        <p class="text-xs text-slate-500 leading-relaxed italic">Éléments identifiés automatiquement par spaCy.</p>
                    </div>
                    <div class="lg:col-span-3 bg-slate-900/80 p-6 rounded-2xl border border-white/5 text-sm text-sky-200/70 font-mono">
                        ${entitesPart}
                    </div>
                </section>

                <section class="space-y-6">
                    <h3 class="text-[10px] font-black text-sky-500 uppercase tracking-widest border-b border-white/10 pb-2">Corps du rapport</h3>
                    <div class="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap font-light">
                        ${corpsPur}
                    </div>
                </section>
            </div>

            <footer class="p-8 lg:p-12 bg-black/20 border-t border-white/5">
                <div class="flex flex-col gap-6">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Intelligence Contextuelle</h4>
                    <div class="flex flex-wrap gap-2">
                        ${notions.map(n => `<span class="px-4 py-2 rounded-lg text-[10px] font-black border uppercase tracking-wider transition-all ${getStyleNotion(n)}">${n}</span>`).join('')}
                    </div>
                </div>
            </footer>
        </article>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', initApp);