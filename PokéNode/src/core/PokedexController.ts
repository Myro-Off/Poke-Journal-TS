import { PokemonAPI } from './api';
import { AppHeader } from '../components/pokedex/Header';
import { AppSearch } from '../components/pokedex/SearchBar';
import { AppFilter } from '../components/pokedex/FilterBar';
import { PokeModal } from '../components/pokedex/PokemonModal';
import { PokedexLayout } from '../components/pokedex/PokedexLayout';
import { I18n } from '../services/I18n';
import type { Pokemon, ImageMode, Language, PokemonType, PokemonLite } from '../types/model';

export class PokedexController {

    /* ==========================================================================
       1. PROPRIÉTÉS & ÉTAT
       ========================================================================== */

    // --- Données Pokémon ---
    private globalIndex: PokemonLite[] = [];          // Liste légère (ID, Nom, URL)
    private filteredIds: number[] = [];               // Liste des IDs après filtrage
    private currentPagePokemons: (Pokemon | PokemonLite)[] = []; // Page courante

    // --- Données de Référence (Dynamiques via API) ---
    private availableTypes: string[] = [];
    private availableGens: string[] = [];

    // --- Configuration ---
    private currentPage = 1;
    private itemsPerPage = 20;
    private currentMode: ImageMode = 'artwork';
    private currentLang: Language = 'fr';

    // --- État des Filtres ---
    private currentFilterType: PokemonType | 'all' = 'all';
    private currentFilterGen: string | 'all' = 'all';
    private currentSearchText: string = "";

    // --- Composants Visuels (Web Components) ---
    private header!: AppHeader;
    private modal!: PokeModal;

    // --- Technique ---
    private currentRequestId = 0;

    /* ==========================================================================
       2. DÉMARRAGE DE L'APPLICATION
       ========================================================================== */

    constructor() {
        // On lance l'application
        this.startApplication().catch(console.error);
    }

    private async startApplication() {
        // 1. Mise en place du Layout HTML de base
        this.initializeLayout();

        // 2. Connexion aux composants majeurs (Header & Modal)
        this.initializeHeader();
        this.initializeModal();

        // 3. Chargement des données (Types, Gens, Pokémons)
        await this.loadAllData();

        // 4. Injection des contrôles (Search & Filter) maintenant qu'on a les données
        this.initializeControls();

        // 5. Activation des événements globaux
        this.attachAllEvents();
    }

    private initializeLayout() {
        PokedexLayout.renderBaseLayout();
    }

    private initializeHeader() {
        const headerEl = document.querySelector('app-header');
        if (headerEl instanceof AppHeader) {
            this.header = headerEl;

            // Écoute du changement de langue/mode depuis le Header
            this.header.onSettingsChange = (lang, mode) => this.onSettingsChange(lang, mode);

            // Init des attributs
            this.header.setAttribute('lang', this.currentLang);
            this.header.setAttribute('mode', this.currentMode);
        } else {
            console.error("ERREUR : <app-header> introuvable.");
        }
    }

    private initializeModal() {
        // Vérification si le modal existe déjà
        let modalEl = document.querySelector('poke-modal');

        if (!modalEl) {
            // Création dynamique et injection
            modalEl = document.createElement('poke-modal');
            document.body.appendChild(modalEl);
        }

        this.modal = modalEl as PokeModal;

        // Init des attributs
        this.modal.setAttribute('lang', this.currentLang);
        this.modal.setAttribute('mode', this.currentMode);

        // Écoute de l'événement Custom 'settings-change' venant du Modal
        this.modal.addEventListener('settings-change', (e: Event) => {
            const customEvent = e as CustomEvent;
            const { lang, mode } = customEvent.detail;
            this.onSettingsChange(lang, mode);
        });
    }

    private async loadAllData() {
        try {
            // Chargement parallèle pour la performance
            const [types, gens, pokemons] = await Promise.all([
                PokemonAPI.getTypesList(),
                PokemonAPI.getGenerationsList(),
                PokemonAPI.getAllPokemonLite()
            ]);

            this.availableTypes = types;
            this.availableGens = gens;
            this.globalIndex = pokemons;
            this.filteredIds = this.globalIndex.map(p => p.id);

            // Chargement de la première page
            await this.loadPage(1);
        } catch (e) {
            console.error("Erreur critique API :", e);
        }
    }

    private initializeControls() {
        // --- A. SearchBar ---
        const searchContainer = document.getElementById('header-search');
        if (searchContainer && !searchContainer.querySelector('app-search')) {
            const searchComp = document.createElement('app-search') as AppSearch;

            searchComp.setAttribute('lang', this.currentLang);

            searchComp.onSearch = (text) => {
                this.currentSearchText = text;
                this.applyFilters();
            };
            searchComp.value = this.currentSearchText;

            searchContainer.appendChild(searchComp);
        }

        // --- B. FilterBar ---
        const filterContainer = document.getElementById('header-filters');
        if (filterContainer && !filterContainer.querySelector('app-filter')) {
            const filterComp = document.createElement('app-filter') as AppFilter;

            filterComp.setAttribute('lang', this.currentLang);

            // Injection des données API
            filterComp.typesList = this.availableTypes;
            filterComp.gensList = this.availableGens;

            // Restauration état
            filterComp.setAttribute('type', this.currentFilterType);
            filterComp.setAttribute('gen', this.currentFilterGen);

            filterComp.onFilter = (type, gen) => {
                this.currentFilterType = type;
                this.currentFilterGen = gen;
                this.applyFilters();
            };

            filterContainer.appendChild(filterComp);
        }
    }

    /* ==========================================================================
       3. LOGIQUE MÉTIER : NAVIGATION & CHARGEMENT
       ========================================================================== */

    async loadPage(page: number) {
        const totalPages = Math.ceil(this.filteredIds.length / this.itemsPerPage) || 1;
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        this.currentPage = page;
        const myRequestId = ++this.currentRequestId;

        const start = (page - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const idsToLoad = this.filteredIds.slice(start, end);

        this.displayLiteData(idsToLoad, totalPages);
        await this.fetchAndDisplayFullData(idsToLoad, myRequestId);
    }

    private displayLiteData(ids: number[], totalPages: number) {
        const liteData = ids.map(id => this.globalIndex.find(p => p.id === id)!);
        this.currentPagePokemons = liteData;

        // Rendu Grille
        PokedexLayout.renderGrid(this.currentPagePokemons, this.currentMode);

        // Rendu Pagination
        PokedexLayout.updatePaginationUI(this.currentPage, totalPages, (p) => this.loadPage(p));

        // Mise à jour de la liste de contexte du Modal (pour boutons Suivant/Précédent)
        this.modal.contextList = this.currentPagePokemons as Pokemon[];
    }

    private async fetchAndDisplayFullData(ids: number[], requestId: number) {
        try {
            const promises = ids.map(id => PokemonAPI.getPokemonDetails(id));
            const results = await Promise.allSettled(promises);

            if (this.currentRequestId !== requestId) return;

            this.currentPagePokemons = results
                .filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
                .map(r => r.value);

            // Mise à jour Grille & Modal avec données complètes
            PokedexLayout.renderGrid(this.currentPagePokemons, this.currentMode);
            this.modal.contextList = this.currentPagePokemons as Pokemon[];
        } catch (e) {
            console.error("Erreur chargement détails", e);
        }
    }

    /* ==========================================================================
       4. LOGIQUE MÉTIER : FILTRAGE
       ========================================================================== */

    async applyFilters() {
        const searchText = this.normalizeText(this.currentSearchText);
        const isSearchId = !isNaN(Number(searchText)) && searchText !== "";

        // 1. Filtrage local (Texte / ID)
        let candidatesIds = this.globalIndex.filter(p => {
            if (!searchText) return true;
            if (isSearchId) return p.id === Number(searchText);

            const nameEn = this.normalizeText(p.name);
            const cachedFr = PokemonAPI.getCachedPokemon(p.id);
            const nameFr = cachedFr ? this.normalizeText(cachedFr.name.fr) : '';

            return nameEn.includes(searchText) || nameFr.includes(searchText);
        }).map(p => p.id);

        // 2. Filtrage Type
        if (this.currentFilterType !== 'all') {
            const typeIds = await PokemonAPI.getIdsByType(this.currentFilterType);
            const typeSet = new Set(typeIds);
            candidatesIds = candidatesIds.filter(id => typeSet.has(id));
        }

        // 3. Filtrage Génération
        if (this.currentFilterGen !== 'all') {
            const genIds = await PokemonAPI.getIdsByGen(`generation-${this.currentFilterGen.toLowerCase()}`);
            const genSet = new Set(genIds);
            candidatesIds = candidatesIds.filter(id => genSet.has(id));
        }

        this.filteredIds = candidatesIds;
        PokedexLayout.toggleEmptyState(this.filteredIds.length === 0);
        await this.loadPage(1);
    }

    private normalizeText(str: string): string {
        return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    }

    /* ==========================================================================
       5. GESTION DES RÉGLAGES (Propagation)
       ========================================================================== */

    private onSettingsChange(lang: Language, mode: ImageMode) {
        this.currentLang = lang;
        this.currentMode = mode;
        I18n.currentLang = lang;

        // 1. Header
        if (this.header) {
            this.header.setAttribute('lang', lang);
            this.header.setAttribute('mode', mode);
        }

        // 2. Modal
        if (this.modal) {
            this.modal.setAttribute('lang', lang);
            this.modal.setAttribute('mode', mode);
            this.modal.contextList = this.currentPagePokemons as Pokemon[];
        }

        // 3. SearchBar
        const searchComp = document.querySelector('app-search');
        if (searchComp) searchComp.setAttribute('lang', lang);

        // 4. FilterBar
        const filterComp = document.querySelector('app-filter');
        if (filterComp) filterComp.setAttribute('lang', lang);

        // 5. Grille & Pagination
        PokedexLayout.renderGrid(this.currentPagePokemons, this.currentMode);

        const totalPages = Math.ceil(this.filteredIds.length / this.itemsPerPage) || 1;
        PokedexLayout.updatePaginationUI(this.currentPage, totalPages, (p) => this.loadPage(p));
    }

    /* ==========================================================================
       6. ÉVÉNEMENTS GLOBAUX
       ========================================================================== */

    private attachAllEvents() {
        document.getElementById('btn-prev-top')?.addEventListener('click', () => this.loadPage(this.currentPage - 1));
        document.getElementById('btn-next-top')?.addEventListener('click', () => this.loadPage(this.currentPage + 1));

        document.getElementById('pokedex-list')?.addEventListener('click', async (e) => {
            const cardComponent = (e.target as HTMLElement).closest('poke-card') as HTMLElement;
            if (cardComponent) {
                const id = Number(cardComponent.dataset.id);
                const p = this.currentPagePokemons.find(x => x.id === id);

                if (p) {
                    if ('types' in p) {
                        this.modal.open(p as Pokemon);
                    } else {
                        try {
                            const fullPokemon = await PokemonAPI.getPokemonDetails(id);
                            const index = this.currentPagePokemons.findIndex(x => x.id === id);
                            if (index !== -1) this.currentPagePokemons[index] = fullPokemon;
                            this.modal.open(fullPokemon);
                        } catch (err) {
                            console.error("Erreur ouverture modal", err);
                        }
                    }
                }
            }
        });

        globalThis.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    private handleKeyboard(e: KeyboardEvent) {
        if (this.modal.getAttribute('open') === 'true') return;

        const totalPages = Math.ceil(this.filteredIds.length / this.itemsPerPage);

        if (e.key === 'ArrowLeft' && this.currentPage > 1) {
            this.loadPage(this.currentPage - 1);
        }
        if (e.key === 'ArrowRight' && this.currentPage < totalPages) {
            this.loadPage(this.currentPage + 1);
        }
    }
}
