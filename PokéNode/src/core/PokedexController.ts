import { PokemonAPI } from './api';
import { AppHeader } from '../components/pokedex/Header';
import { AppSearch } from '../components/pokedex/SearchBar';
import { AppFilter } from '../components/pokedex/FilterBar';
import { PokeModal } from '../components/pokedex/PokemonModal';
import { PokedexLayout } from '../components/pokedex/PokedexLayout';
import { I18n } from '../services/I18n';
import type { Pokemon, ImageMode, Language, PokemonType, PokemonLite } from '../types/model';

import '../components/teambuilder/TeamBuilderPage';

export class PokedexController {

    // #region ÉTAT & DONNÉES
    // ============================================================================
    private currentView: 'pokedex' | 'builder' = 'pokedex';
    private activeRequestId = 0;

    // Données
    private fullPokemonRegistry: PokemonLite[] = [];
    private currentFilteredIds: number[] = [];
    private visiblePokemonData: (Pokemon | PokemonLite)[] = [];

    // Listes déroulantes
    private typeOptions: string[] = [];
    private genOptions: string[] = [];

    // Pagination
    private currentPage = 1;
    private readonly pageSize = 20;
    
    // Configuration
    private settings = {
        mode: 'artwork' as ImageMode,
        lang: 'fr' as Language
    };

    private filters = {
        type: 'all' as PokemonType | 'all',
        gen: 'all' as string | 'all',
        search: '' as string
    };

    // Références aux composants majeurs
    private components = {
        header: undefined as AppHeader | undefined,
        modal: undefined as PokeModal | undefined
    };
    // #endregion

    // #region INITIALISATION
    // ============================================================================
    constructor() {
        this.init().catch(console.error);
    }

    private async init() {
        this.renderLayout();
        this.mountCoreComponents();
        
        await this.loadInitialData();
        
        this.injectControlBars();
        this.bindGlobalEvents();
        
        this.navigateToPage(1);
    }

    private renderLayout() {
        PokedexLayout.renderBaseLayout();
    }

    private mountCoreComponents() {
        // 1. Header
        const header = document.querySelector('app-header');
        if (header instanceof AppHeader) {
            this.components.header = header;
            this.components.header.setAttribute('lang', this.settings.lang);
            this.components.header.setAttribute('mode', this.settings.mode);
            this.components.header.onSettingsChange = (l, m) => this.handleSettingsUpdate(l, m);
        }

        // 2. Modale (Lazy creation si absente)
        let modal = document.querySelector('poke-modal');
        if (!modal) {
            modal = document.createElement('poke-modal');
            document.body.appendChild(modal);
        }
        this.components.modal = modal as PokeModal;
        this.components.modal.setAttribute('lang', this.settings.lang);
        this.components.modal.setAttribute('mode', this.settings.mode);
        
        this.components.modal.addEventListener('settings-change', (e: any) => 
            this.handleSettingsUpdate(e.detail.lang, e.detail.mode)
        );
    }

    private async loadInitialData() {
        try {
            const [types, gens, allPokemon] = await Promise.all([
                PokemonAPI.getTypesList(),
                PokemonAPI.getGenerationsList(),
                PokemonAPI.getAllPokemonLite()
            ]);

            this.typeOptions = types;
            this.genOptions = gens;
            this.fullPokemonRegistry = allPokemon;
            
            // Par défaut, tout est visible
            this.currentFilteredIds = this.fullPokemonRegistry.map(p => p.id);
        } catch (error) {
            console.error("Erreur chargement initial :", error);
        }
    }

    private injectControlBars() {
        this.mountSearchBar();
        this.mountFilterBar();
    }

    private mountSearchBar() {
        const container = document.getElementById('header-search');
        if (!container || container.querySelector('app-search')) return;

        const searchBar = document.createElement('app-search') as AppSearch;
        searchBar.setAttribute('lang', this.settings.lang);
        
        searchBar.onSearch = (text) => {
            if (this.currentView === 'pokedex') {
                this.filters.search = text;
                this.applyFilters();
            }
        };
        container.appendChild(searchBar);
    }

    private mountFilterBar() {
        const container = document.getElementById('header-filters');
        if (!container || container.querySelector('app-filter')) return;

        const filterBar = document.createElement('app-filter') as AppFilter;
        filterBar.setAttribute('lang', this.settings.lang);
        filterBar.typesList = this.typeOptions;
        filterBar.gensList = this.genOptions;
        
        filterBar.onFilter = (type, gen) => {
            if (this.currentView === 'pokedex') {
                this.filters.type = type;
                this.filters.gen = gen;
                this.applyFilters();
            }
        };
        container.appendChild(filterBar);
    }
    // #endregion

    // #region NAVIGATION & CHARGEMENT PAGINÉ
    // ============================================================================
    private async navigateToPage(pageNumber: number) {
        if (this.currentView !== 'pokedex') return;

        const totalPages = this.calculateTotalPages();
        const safePage = Math.max(1, Math.min(pageNumber, totalPages));

        this.currentPage = safePage;
        const requestId = ++this.activeRequestId;

        // 1. Récupérer les IDs de la page
        const idsToLoad = this.getIdsForCurrentPage();

        // 2. Afficher immédiatement les données légères (Lite)
        this.renderPage(idsToLoad, totalPages);

        // 3. Enrichir avec les données complètes (API) en arrière-plan
        await this.enrichPageData(idsToLoad, requestId);
    }

    private renderPage(ids: number[], totalPages: number) {
        // On récupère les objets Lite depuis le registre complet
        const liteData = ids.map(id => this.fullPokemonRegistry.find(p => p.id === id)!);
        this.visiblePokemonData = liteData;
        
        PokedexLayout.renderGrid(this.visiblePokemonData, this.settings.mode);
        PokedexLayout.updatePaginationUI(this.currentPage, totalPages, (p) => this.navigateToPage(p));
        
        // On met à jour la liste de navigation de la modale pour le carrousel
        if (this.components.modal) {
            this.components.modal.navigationList = this.visiblePokemonData as Pokemon[];
        }
    }

    private async enrichPageData(ids: number[], requestId: number) {
        try {
            const promises = ids.map(id => PokemonAPI.getPokemonDetails(id));
            const results = await Promise.allSettled(promises);
            
            // Si l'utilisateur a changé de page entre temps, on ignore
            if (this.activeRequestId !== requestId) return;

            // On remplace les données Lite par les données Full là où c'est possible
            this.visiblePokemonData = results
                .filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
                .map(r => r.value);

            // Re-rendu pour afficher les types complets, stats, etc. si nécessaire dans la grille
            PokedexLayout.renderGrid(this.visiblePokemonData, this.settings.mode);
            
            if (this.components.modal) {
                this.components.modal.navigationList = this.visiblePokemonData as Pokemon[];
            }
        } catch (error) {
            console.error("Erreur enrichissement page :", error);
        }
    }

    private getIdsForCurrentPage(): number[] {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.currentFilteredIds.slice(start, end);
    }

    private calculateTotalPages(): number {
        return Math.ceil(this.currentFilteredIds.length / this.pageSize) || 1;
    }
    // #endregion

    // #region LOGIQUE DE FILTRAGE
    // ============================================================================
    private async applyFilters() {
        let candidates = this.fullPokemonRegistry;

        // 1. Filtres attributs (Type / Gen)
        candidates = await this.filterByAttributes(candidates);

        // 2. Recherche textuelle (Search)
        if (this.filters.search) {
            candidates = this.filterAndSortBySearch(candidates);
        } else {
            // Tri par défaut (ID)
            candidates.sort((a, b) => a.id - b.id);
        }

        this.currentFilteredIds = candidates.map(p => p.id);
        PokedexLayout.toggleEmptyState(this.currentFilteredIds.length === 0);
        
        // Retour à la page 1 après filtrage
        await this.navigateToPage(1);
    }

    private async filterByAttributes(candidates: PokemonLite[]): Promise<PokemonLite[]> {
        if (this.filters.type !== 'all') {
            const typeIds = new Set(await PokemonAPI.getIdsByType(this.filters.type));
            candidates = candidates.filter(p => typeIds.has(p.id));
        }

        if (this.filters.gen !== 'all') {
            const genSlug = `generation-${this.filters.gen.toLowerCase()}`;
            const genIds = new Set(await PokemonAPI.getIdsByGen(genSlug));
            candidates = candidates.filter(p => genIds.has(p.id));
        }

        return candidates;
    }

    private filterAndSortBySearch(candidates: PokemonLite[]): PokemonLite[] {
        const term = this.normalize(this.filters.search);
        
        const scored = candidates.map(p => ({
            pokemon: p,
            score: this.calculateRelevance(p, term)
        }));

        return scored
            .filter(item => item.score > 0)
            .sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score; // Score décroissant
                
                // Si égalité et score très haut (match ID), on trie par longueur d'ID
                if (a.score >= 90) {
                    const lenA = a.pokemon.id.toString().length;
                    const lenB = b.pokemon.id.toString().length;
                    return lenA !== lenB ? lenA - lenB : a.pokemon.id - b.pokemon.id;
                }
                
                // Sinon alphabétique
                const nameA = this.getDisplayName(a.pokemon);
                const nameB = this.getDisplayName(b.pokemon);
                return nameA.localeCompare(nameB);
            })
            .map(item => item.pokemon);
    }

    private calculateRelevance(p: PokemonLite, term: string): number {
        const idStr = p.id.toString();
        const name = this.normalize(this.getDisplayName(p));
        const abilities = this.settings.lang === 'fr' 
            ? (p.abilities?.fr || []) 
            : (p.abilities?.en || []);

        // 1. Match Exact ID (100 pts)
        if (idStr === term) return 100;
        
        // 2. ID commence par (90 pts)
        if (idStr.startsWith(term)) return 90;

        // 3. Nom commence par (80 pts)
        if (name.startsWith(term)) return 80;
        
        // 4. Nom contient (60 pts)
        if (name.includes(term)) return 60;

        // 5. Talent contient (50 pts)
        if (abilities.some(a => this.normalize(a).includes(term))) return 50;
        
        // 6. ID contient (40 pts)
        if (idStr.includes(term)) return 40;

        return 0;
    }

    private normalize(str: string): string {
        return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    }

    private getDisplayName(p: PokemonLite): string {
        return this.settings.lang === 'fr' ? p.name : (p.nameEn || p.name);
    }
    // #endregion

    // #region GESTION VUES & PARAMÈTRES
    // ============================================================================
    private handleSettingsUpdate(lang: Language, mode: ImageMode) {
        this.settings.lang = lang;
        this.settings.mode = mode;
        I18n.currentLang = lang;

        this.syncComponentAttributes();
        
        // Notification globale pour les composants découplés
        window.dispatchEvent(new CustomEvent('settings:changed', { detail: { lang, mode } }));

        if (this.currentView === 'pokedex') {
            // Si on est dans le pokédex, on rafraichit la recherche (car les noms changent)
            if (this.filters.search) {
                this.applyFilters();
            } else {
                this.renderPage(this.getIdsForCurrentPage(), this.calculateTotalPages());
            }
        }

        // Cas particulier : Modale de combat dans le TeamBuilder
        const battleModal = document.querySelector('battle-prep-modal') as any;
        if (battleModal?.setMode) battleModal.setMode(mode);
    }

    private syncComponentAttributes() {
        const { lang, mode } = this.settings;
        this.components.header?.setAttribute('lang', lang);
        this.components.header?.setAttribute('mode', mode);
        this.components.modal?.setAttribute('lang', lang);
        this.components.modal?.setAttribute('mode', mode);
        document.querySelector('app-search')?.setAttribute('lang', lang);
        document.querySelector('app-filter')?.setAttribute('lang', lang);
    }

    private switchView(view: 'pokedex' | 'builder') {
        this.currentView = view;
        const isPokedex = view === 'pokedex';

        // Toggle Visibilité UI
        const list = document.getElementById('pokedex-list');
        const pagination = document.querySelector('.pagination-controls') as HTMLElement;
        const search = document.getElementById('header-search');
        const filters = document.getElementById('header-filters');

        if (list) list.style.display = isPokedex ? 'grid' : 'none';
        if (pagination) pagination.style.display = isPokedex ? 'flex' : 'none';
        if (search) search.style.visibility = isPokedex ? 'visible' : 'hidden';
        if (filters) filters.style.visibility = isPokedex ? 'visible' : 'hidden';

        // Gestion du composant Team Builder (Lazy Load)
        let builder = document.querySelector('team-builder-page') as HTMLElement;
        if (!builder && !isPokedex) {
            builder = document.createElement('team-builder-page');
            document.getElementById('app')?.appendChild(builder);
        }
        if (builder) builder.style.display = isPokedex ? 'none' : 'block';

        this.components.header?.setViewMode(view);
    }
    // #endregion

    // #region INTERACTIONS & ÉVÉNEMENTS
    // ============================================================================
    private bindGlobalEvents() {
        // Pagination
        document.getElementById('btn-prev-top')?.addEventListener('click', () => this.navigateToPage(this.currentPage - 1));
        document.getElementById('btn-next-top')?.addEventListener('click', () => this.navigateToPage(this.currentPage + 1));
        
        // Navigation Inter-Vues
        document.body.addEventListener('open-teams', () => this.switchView('builder'));
        document.body.addEventListener('navigate-home', () => this.switchView('pokedex'));

        // Clavier
        globalThis.addEventListener('keydown', (e) => this.onGlobalKeyDown(e));

        // Clics (Délégation)
        document.getElementById('pokedex-list')?.addEventListener('click', (e) => this.onGridCardClicked(e));
    }

    private onGlobalKeyDown(e: KeyboardEvent) {
        if (this.currentView !== 'pokedex') return;
        if (this.components.modal?.getAttribute('open') === 'true') return;
        
        const total = this.calculateTotalPages();
        if (e.key === 'ArrowLeft' && this.currentPage > 1) this.navigateToPage(this.currentPage - 1);
        if (e.key === 'ArrowRight' && this.currentPage < total) this.navigateToPage(this.currentPage + 1);
    }

    private onGridCardClicked(e: Event) {
        const card = (e.target as HTMLElement).closest('poke-card') as HTMLElement;
        if (!card) return;

        const id = Number(card.dataset.id);
        const pokemon = this.visiblePokemonData.find(x => x.id === id);
        
        if (pokemon) {
            this.openModalForPokemon(pokemon, id);
        }
    }

    private async openModalForPokemon(pokemon: PokemonLite | Pokemon, id: number) {
        if (!this.components.modal) return;

        this.components.modal.navigationList = this.visiblePokemonData as Pokemon[];

        // Si on a déjà les détails complets (propriété 'moves' existe), on ouvre direct
        if ('moves' in pokemon) {
            this.components.modal.open(pokemon as Pokemon);
        } else {
            // Sinon on fetch les détails
            try {
                const fullDetails = await PokemonAPI.getPokemonDetails(id);
                
                // On met à jour le cache local visible pour éviter de refetch si on rouvre
                const idx = this.visiblePokemonData.findIndex(x => x.id === id);
                if (idx !== -1) this.visiblePokemonData[idx] = fullDetails;
                
                this.components.modal.open(fullDetails);
            } catch (err) {
                console.error("Erreur ouverture modale :", err);
            }
        }
    }
    // #endregion
}