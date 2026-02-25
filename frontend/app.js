fetch(`${CONFIG.API_URL}/articles`)
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

    // Dictionnaire (Catégorie : [mots-clés])
    const lexiqueCyber = {
        "Vuln & Exploit": ["rce", "zero-day", "0-day", "cve-", "buffer overflow", "sqli", "xss", "lpe", "privilege escalation", "poc"],
        "Malware & C2": ["ransomware", "malware", "rat", "infostealer", "rootkit", "command and control", "c2", "cobalt strike", "beacon", "botnet"],
        "Threat Intel & APT": ["apt", "threat actor", "campaign", "ttp", "state-sponsored", "lazarus", "fancy bear"],
        "Identity & Access": ["active directory", "entra id", "kerberos", "mfa bypass", "credentials", "ntlm", "saml", "oauth"],
        "Defensive & Blue Team": ["edr", "siem", "yara", "sigma", "mitigation", "patch", "soc", "incident response", "forensics", "xdr"],
        "Network & Infra": ["lateral movement", "exfiltration", "ddos", "mitm", "firewall", "vpn", "ipsec", "proxy"],
        "Cloud & Containers": ["aws", "azure", "gcp", "kubernetes", "k8s", "docker", "cloud security", "tenant", "s3"],
        "Cryptography": ["pqc", "quantum-safe", "encryption", "rsa", "tls", "certificates", "qkd"]
    };

    // Analyse du texte avec des Regex pour chercher des mots exacts 
    for (const [tag, keywords] of Object.entries(lexiqueCyber)) {
        for (const keyword of keywords) {
            const regexStr = keyword.endsWith('-') ? `\\b${keyword}` : `\\b${keyword}\\b`;
            const regex = new RegExp(regexStr, 'i');

            if (regex.test(t)) {
                tags.add(tag);
                break; // on passe à la catégorie suivante
            }
        }
    }

    return tags.size > 0 ? Array.from(tags) : ["General Intel"];
}

function getStyleNotion(n) {
    // Un code couleur spécifique pour chaque catégorie cyber pour une lecture visuelle immédiate
    const map = {
        "Vuln & Exploit": "bg-red-500/10 border-red-500/30 text-red-400",
        "Malware & C2": "bg-purple-500/10 border-purple-500/30 text-purple-400",
        "Threat Intel & APT": "bg-orange-500/10 border-orange-500/30 text-orange-400",
        "Identity & Access": "bg-amber-500/10 border-amber-500/30 text-amber-400",
        "Defensive & Blue Team": "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        "Network & Infra": "bg-blue-500/10 border-blue-500/30 text-blue-300",
        "Cloud & Containers": "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
        "Cryptography": "bg-slate-500/10 border-slate-500/30 text-slate-300"
    };
    return map[n] || "bg-sky-500/10 border-sky-500/30 text-sky-400";
}

function formatMarkdown(text) {
    if (!text) return "";
    let html = text;
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-2xl font-black text-white mt-10 mb-6">$1</h2>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-xl font-bold text-sky-400 mt-10 mb-4 border-b border-sky-500/20 pb-2"><i class="fas fa-crosshairs mr-2 text-sm"></i>$1</h3>');
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-lg font-bold text-slate-200 mt-8 mb-3">$1</h4>');
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-sky-500 hover:text-sky-300 underline font-medium transition-colors break-words"><i class="fas fa-link text-[10px] mr-1"></i>$1</a>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-bold">$1</strong>');
    html = html.replace(/^\s*-\s(.*$)/gim, '<li class="ml-6 list-disc marker:text-sky-500 text-slate-300 mb-2">$1</li>');
    return html;
}

// --- LOGIQUE DE TRADUCTION INVISIBLE ---

function loadGoogleTranslate() {
    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            autoDisplay: false, // Empêche Google d'afficher des popups
            includedLanguages: 'en,fr,es,de' // Limite aux langues utiles
        }, 'google_translate_element_hidden');
    };
    const script = document.createElement('script');
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(script);
}

// La fonction magique qui relie notre beau menu au widget moche de Google
window.changeLanguage = function (langCode) {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
    }
};

// --- LOGIQUE DE L'APPLICATION ---

const initApp = async () => {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="google_translate_element_hidden" style="display:none;"></div>

        <header class="p-4 md:p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center glass sticky top-0 z-50 gap-4">
            <div class="flex items-center gap-3 cursor-pointer w-full md:w-auto justify-start" onclick="renderListView()">
                <div class="bg-sky-500 p-2 rounded-lg shadow-lg">
                    <i class="fas fa-shield-alt text-white"></i>
                </div>
                <h1 class="text-xl font-bold tracking-tight">Cyber<span class="text-sky-400">Watch</span></h1>
            </div>
            
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div class="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 hover:border-sky-500/50 transition-colors shadow-inner w-full sm:w-auto">
                    <i class="fas fa-language text-sky-500"></i>
                    <select onchange="changeLanguage(this.value)" class="bg-transparent text-slate-300 text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-4 w-full">
                        <option value="en" class="bg-slate-900 text-white">🇺🇸 English</option>
                        <option value="fr" class="bg-slate-900 text-white">🇫🇷 Français</option>
                        <option value="es" class="bg-slate-900 text-white">🇪🇸 Español</option>
                        <option value="de" class="bg-slate-900 text-white">🇩🇪 Deutsch</option>
                    </select>
                </div>
                
                <div class="relative w-full sm:w-auto">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input type="text" id="mainSearch" placeholder="Filter articles..." class="bg-slate-900 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all w-full sm:w-64 md:w-64 placeholder-slate-500">
                </div>
            </div>
        </header>
        <div id="mainContent" class="max-w-5xl mx-auto p-4 md:p-6"></div>
    `;

    loadGoogleTranslate();
    await fetchArticles();
    renderListView();
};

async function fetchArticles() {
    try {
        // Ajoute bien CONFIG. devant API_URL
        const res = await fetch(`${CONFIG.API_URL}/articles`);
        allArticles = await res.json();
    } catch (e) {
        console.error("API Error", e);
    }
}

function renderListView() {
    const container = document.getElementById('mainContent');
    if (allArticles.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-center py-20 italic">No data available.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 md:mb-8">
            <h2 class="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
                <i class="fas fa-layer-group text-sky-500"></i> Intelligence Feed
            </h2>
            <span class="text-xs text-slate-500 font-mono">${allArticles.length} articles loaded</span>
        </div>
        <div class="grid gap-4">
            ${allArticles.map(art => `
                <div onclick="renderDetailView('${art.id}')" class="glass p-4 md:p-5 rounded-xl cursor-pointer border border-white/5 hover:border-sky-500/40 transition-all group">
                    <div class="flex justify-between items-start md:items-center mb-3 gap-2 flex-col md:flex-row">
                        <span class="text-[9px] md:text-[10px] font-black text-sky-500 uppercase tracking-widest bg-sky-500/10 px-2 py-1 rounded inline-block">${art.source}</span>
                        <span class="text-[10px] text-slate-500 font-mono shrink-0">${formatSmartDate(art.date)}</span>
                    </div>
                    <h3 class="text-base md:text-lg font-bold group-hover:text-sky-400 transition-colors mb-2 leading-snug">${art.titre}</h3>
                    <p class="text-slate-400 text-xs md:text-sm leading-relaxed line-clamp-2">${art.resume}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDetailView(id) {
    const art = allArticles.find(a => a.id === id);
    if (!art) return;

    const notions = detecterNotionsComplexes(art.contenu + art.titre);

    const entitesPart = art.contenu.match(/ENTITÉS:(.*?)CONTENU:/s)?.[1] || "Analysis in progress...";
    const corpsPur = art.contenu.split("CONTENU:")[1] || art.contenu;

    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <button onclick="renderListView()" class="mb-6 md:mb-8 text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-tighter bg-slate-900/50 w-fit px-4 py-2 rounded-lg">
            <i class="fas fa-chevron-left"></i> Back to feed
        </button>
        
        <article class="glass rounded-2xl md:rounded-3xl overflow-hidden animate-fade-in border border-white/10 shadow-2xl">
            <header class="p-6 md:p-8 lg:p-12 bg-gradient-to-br from-slate-900 to-sky-900/20 border-b border-white/5">
                <div class="flex flex-wrap items-center gap-3 text-xs font-bold mb-4 md:mb-6">
                    <span class="bg-sky-500 text-white px-2 py-1 md:px-3 md:py-1 rounded">${art.source}</span>
                    <span class="text-slate-400">${formatSmartDate(art.date)}</span>
                </div>
                <h1 class="text-2xl md:text-3xl lg:text-5xl font-black text-white mb-6 md:mb-8 leading-tight">${art.titre}</h1>
                <a href="${art.url}" target="_blank" class="inline-flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 text-xs font-bold bg-white/5 px-4 py-3 md:py-2 rounded-lg md:rounded-full border border-white/10 transition-all w-full md:w-auto">
                    SOURCE LINK <i class="fas fa-external-link-alt"></i>
                </a>
            </header>

            <div class="p-6 md:p-8 lg:p-12 space-y-8 md:space-y-12">
                <section class="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                    <div class="lg:col-span-1">
                        <h3 class="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2">NER Extraction</h3>
                        <p class="text-[10px] md:text-xs text-slate-500 leading-relaxed italic">Elements identified automatically by spaCy.</p>
                    </div>
                    <div class="lg:col-span-3 bg-slate-900/80 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 text-xs md:text-sm text-sky-200/70 font-mono overflow-x-auto">
                        ${entitesPart}
                    </div>
                </section>

                <section class="space-y-4 md:space-y-6">
                    <h3 class="text-[10px] font-black text-sky-500 uppercase tracking-widest border-b border-white/10 pb-2">Report Body</h3>
                    <div class="text-slate-300 leading-relaxed text-sm md:text-lg font-light whitespace-pre-wrap">
                        ${formatMarkdown(corpsPur.trim())}
                    </div>
                </section>
            </div>

            <footer class="p-6 md:p-8 lg:p-12 bg-black/20 border-t border-white/5">
                <div class="flex flex-col gap-4 md:gap-6">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Contextual Intelligence</h4>
                    <div class="flex flex-wrap gap-2">
                        ${notions.map(n => `<span class="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[9px] md:text-[10px] font-black border uppercase tracking-wider transition-all ${getStyleNotion(n)}">${n}</span>`).join('')}
                    </div>
                </div>
            </footer>
        </article>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', initApp);