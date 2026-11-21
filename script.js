document.addEventListener("DOMContentLoaded", () => {

    // ================= SIDEBAR =================
    const isMobile = () => window.innerWidth <= 900;

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => fecharSidebar());

    function abrirSidebar() {
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('mainContent');
        const reopenBtn = document.getElementById('reopenBtn');

        if (isMobile()) {
            sidebar.classList.add('aberta');
            sidebar.classList.remove('fechada');
            overlay.classList.add('active');
            reopenBtn.style.display = 'none';
        } else {
            sidebar.classList.remove('fechada');
            main.classList.remove('cheia');
            reopenBtn.style.display = 'none';
        }
    }

    function fecharSidebar() {
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('mainContent');
        const reopenBtn = document.getElementById('reopenBtn');

        if (isMobile()) {
            sidebar.classList.remove('aberta');
            overlay.classList.remove('active');
            reopenBtn.style.display = 'flex';
        } else {
            sidebar.classList.add('fechada');
            main.classList.add('cheia');
            reopenBtn.style.display = 'flex';
        }
    }

    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        if (isMobile()) {
            sidebar.classList.contains('aberta') ? fecharSidebar() : abrirSidebar();
        } else {
            sidebar.classList.contains('fechada') ? abrirSidebar() : fecharSidebar();
        }
    };

    (function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('mainContent');
        const reopenBtn = document.getElementById('reopenBtn');
        if (isMobile()) {
            sidebar.classList.remove('aberta');
            reopenBtn.style.display = 'flex';
        } else {
            sidebar.classList.remove('fechada');
            main.classList.remove('cheia');
            reopenBtn.style.display = 'none';
        }
    })();

    // ================= SLIDER INFINITO =================
    window.moveSlider = function(sliderId, direction) {
        const slider = document.getElementById(sliderId);
        const scrollAmount = 310;
        if (!slider.dataset.cloned) {
            const cards = Array.from(slider.children);
            cards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                slider.appendChild(clone);
            });
            slider.scrollLeft = 0;
            slider.dataset.cloned = 'true';
        }
        const totalWidth = slider.scrollWidth;
        const half = totalWidth / 2;
        slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
        setTimeout(() => {
            if (slider.scrollLeft >= half - 5) {
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft -= half;
                slider.style.scrollBehavior = '';
            }
            if (slider.scrollLeft <= 5) {
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft += half;
                slider.style.scrollBehavior = '';
            }
        }, 400);
    };

    // ================= BUSCA + AUTOCOMPLETE =================
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchDropdown = document.getElementById('searchDropdown');

    function normalize(text) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 ]/g, '')
            .trim();
    }

    // Categorias da V9 Sports, com inclusões/exclusões pra não misturar
    const categories = {
        'chuteira':   { must: ['chuteira', 'chuteiras', 'society', 'futsal'], exclude: ['bola'] },
        'time':       { must: ['sao paulo', 'corinthians', 'palmeiras'], exclude: [] },
        'camisa':     { must: ['camisa', 'camiseta'], exclude: ['moletom', 'conjunto', 'dry fit', 'jaqueta'] },
        'roupa':      { must: ['jaqueta', 'corta vento', 'dry fit', 'moletom', 'conjunto moletom'], exclude: ['camisa', 'time'] },
        'short':      { must: ['short', 'bermuda'], exclude: ['conjunto', 'kit'] },
        'meia':       { must: ['meia', 'meiao', 'meioes'], exclude: [] },
        'caneleira':  { must: ['caneleira'], exclude: [] },
        'bola':       { must: ['bola de futebol', 'bola de futsal', 'bola society', 'bola'], exclude: ['bolsa'] },
        'treino':     { must: ['cone', 'escada de agilidade', 'colete de treino', 'agilidade'], exclude: [] },
        'luva':       { must: ['luva', 'luvas', 'goleiro'], exclude: [] },
        'bolsa':      { must: ['bolsa', 'mochila'], exclude: [] },
    };

    const catSearchMap = {
        'Chuteiras':              'chuteira',
        'Camisas de Time':        'time',
        'Camisas de Times':       'time',
        'Roupas Esportivas':      'roupa',
        'Shorts':                 'short',
        'Meias e Meiões':         'meia',
        'Caneleiras':             'caneleira',
        'Bolas':                  'bola',
        'Equipamentos de Treino': 'treino',
        'Luvas de Goleiro':       'luva',
        'Bolsas e Mochilas':      'bolsa',
    };

    function getCategoryForQuery(query) {
        const norm = normalize(query);
        for (const [cat, { must }] of Object.entries(categories)) {
            if (must.some(w => norm.includes(w)) || norm === cat) {
                return cat;
            }
        }
        return null;
    }

    function matchSearch(title, query) {
        const normTitle = normalize(title);
        const normQuery = normalize(query);

        if (!normQuery) return false;

        // 1) Busca direta: título contém exatamente o que foi digitado
        if (normTitle.includes(normQuery)) return true;

        // 2) Prefixo em qualquer palavra do título
        const titleWords = normTitle.split(' ');
        if (normQuery.length >= 2 && titleWords.some(w => w.startsWith(normQuery))) return true;

        // 3) Detecta categoria pelo que foi digitado
        const cat = getCategoryForQuery(normQuery);
        if (cat && cat !== 'time') {
            const { must, exclude } = categories[cat];
            if (cat === 'camisa') {
                const isTimeShirt = categories['time'].must.some(w => normTitle.includes(w));
                if (isTimeShirt) return false;
            }
            const hasRequired = must.some(w => normTitle.includes(w));
            const hasExcluded = exclude.some(w => normTitle.includes(w));
            return hasRequired && !hasExcluded;
        }

        // 4) Cada palavra da query como prefixo ou substring no título
        const queryWords = normQuery.split(' ').filter(w => w.length >= 1);
        if (queryWords.length > 1) {
            return queryWords.every(qw =>
                normTitle.includes(qw) || titleWords.some(tw => tw.startsWith(qw))
            );
        }

        return false;
    }

    function applyFilter(query) {
        const resultsPage = document.getElementById('searchResultsPage');
        const resultsGrid = document.getElementById('searchResultsGrid');
        const resultsQuery = document.getElementById('searchResultsQuery');
        const resultsCount = document.getElementById('searchResultsCount');
        const contentMain = document.getElementById('contentMain');

        const allCards = document.querySelectorAll('.card');

        const isCamisaFilter = query === 'camisa';
        const isTimeFilter = query === 'time';

        const isSectionFilter = {
            'chuteira':  'sec-chuteiras',
            'time':      'sec-camisas',
            'roupa':     'sec-roupas',
            'short':     'sec-shorts',
            'meia':      'sec-meias',
            'caneleira': 'sec-caneleiras',
            'bola':      'sec-bolas',
            'treino':    'sec-treino',
            'luva':      'sec-luvas',
            'bolsa':     'sec-bolsas',
        }[query];

        const seen = new Set();
        const matched = [];

        allCards.forEach(c => {
            const title = c.querySelector('h3').textContent.trim();
            const section = c.closest('section');

            if (isCamisaFilter && section && (section.id === 'sec-camisas' || section.id === 'sec-camisas-extra')) return;

            if (isTimeFilter) {
                if (!section || (section.id !== 'sec-camisas' && section.id !== 'sec-camisas-extra')) return;
                if (!seen.has(title)) { seen.add(title); matched.push(c); }
                return;
            }

            if (isSectionFilter) {
                if (!section || section.id !== isSectionFilter) return;
                if (!seen.has(title)) { seen.add(title); matched.push(c); }
                return;
            }

            if (matchSearch(title, query) && !seen.has(title)) {
                seen.add(title);
                matched.push(c);
            }
        });

        resultsGrid.innerHTML = '';
        matched.forEach(card => {
            const clone = card.cloneNode(true);
            clone.style.cssText = 'display: block !important';
            resultsGrid.appendChild(clone);
        });

        resultsQuery.textContent = `"${query}"`;
        resultsCount.textContent = matched.length === 0
            ? 'Nenhum produto encontrado'
            : `${matched.length} produto${matched.length > 1 ? 's' : ''} encontrado${matched.length > 1 ? 's' : ''}`;

        resultsPage.classList.add('active');
        contentMain.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) return;
            searchDropdown.classList.remove('active');
            applyFilter(query);
        }
    });

    searchInput.addEventListener('input', () => {
        const raw = searchInput.value;
        const query = raw.toLowerCase().trim();
        searchClear.style.opacity = query ? '1' : '0';
        searchClear.style.pointerEvents = query ? 'all' : 'none';

        searchDropdown.innerHTML = '';
        if (!query || query.length < 1) { searchDropdown.classList.remove('active'); return; }

        const allCards = document.querySelectorAll('.card');
        const seen = new Set();
        const matches = [];

        allCards.forEach(card => {
            const h3 = card.querySelector('h3');
            if (!h3) return;
            const title = h3.textContent.trim();
            if (matchSearch(title, query) && !seen.has(title)) {
                seen.add(title);
                matches.push({ name: title, card });
            }
        });

        if (matches.length === 0) {
            searchDropdown.innerHTML = '<div class="dropdown-empty">Nenhum produto encontrado</div>';
            searchDropdown.classList.add('active');
            return;
        }

        matches.slice(0, 8).forEach(({ name }) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');
            const highlighted = name.replace(regex, '<mark>$1</mark>');
            item.innerHTML = '<i class="fas fa-tag"></i> ' + highlighted;
            item.addEventListener('click', () => {
                searchInput.value = name;
                searchDropdown.classList.remove('active');
                applyFilter(name);
            });
            searchDropdown.appendChild(item);
        });

        if (matches.length > 8) {
            const more = document.createElement('div');
            more.className = 'dropdown-more';
            more.textContent = `+ ${matches.length - 8} produto(s) — pressione Enter para ver todos`;
            more.addEventListener('click', () => {
                searchDropdown.classList.remove('active');
                applyFilter(query);
            });
            searchDropdown.appendChild(more);
        }

        searchDropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchDropdown.classList.remove('active');
        }
    });

    window.clearSearch = function() {
        searchInput.value = '';
        searchClear.style.opacity = '0';
        searchClear.style.pointerEvents = 'none';
        searchDropdown.classList.remove('active');
        document.getElementById('searchResultsPage').classList.remove('active');
        document.getElementById('contentMain').classList.remove('hidden');
        searchInput.focus();
    };

    // ================= BANNERS =================
    const banners = document.querySelectorAll('.banner-categoria[data-filter]');
    banners.forEach(banner => {
        banner.style.cursor = 'pointer';
        banner.addEventListener('click', (e) => {
            e.preventDefault();
            const key = banner.getAttribute('data-filter');
            const label = banner.querySelector('h2').textContent.trim();
            searchInput.value = label;
            applyFilter(key);
        });
    });

    // ================= CATEGORIAS =================
    const cats = document.querySelectorAll('.cat');

    cats.forEach(cat => {
        cat.style.cursor = 'pointer';
        cat.addEventListener('click', () => {
            const label = cat.querySelector('p').textContent.trim();
            const key = catSearchMap[label];
            if (key) {
                searchInput.value = label;
                applyFilter(key);
            }
        });
    });

    // ================= MENU LATERAL =================
    const menuItems = document.querySelectorAll('.nav-item');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const label = item.textContent.trim();
            if (label.includes('Início')) {
                clearSearch();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            let targetId = null;
            if (label.includes('Destaques')) targetId = 'sec-destaques';
            if (label.includes('Chuteiras'))       { applyFilter('chuteira');  return; }
            if (label.includes('Luvas de Goleiro')){ applyFilter('luva');      return; }
            if (targetId) {
                const section = document.getElementById(targetId);
                if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

});