import { PokemonAPI } from './api';
import { AppHeader } from '../components/pokedex/Header';
import { AppSearch } from '../components/pokedex/SearchBar';
import { AppFilter } from '../components/pokedex/FilterBar';
import { PokeModal } from '../components/pokedex/PokemonModal';
import { PokedexLayout } from '../components/pokedex/PokedexLayout';
import { I18n } from '../services/I18n';
import { TeamService } from '../services/TeamService';
import type { Pokemon, ImageMode, Language, PokemonType, PokemonLite } from '../types/model';

import '../components/teambuilder/TeamBuilderPage';

export class PokedexController {

    // #region PROPRIÉTÉS & ÉTAT
    // ============================================================================
    
    // État de la Vue
    private currentView: 'pokedex' | 'builder' = 'pokedex';

    // Données
    private globalIndex: PokemonLite[] = [];
    private filteredIds: number[] = [];
    private currentPagePokemons: (Pokemon | PokemonLite)[] = [];

    // Listes déroulantes
    private availableTypes: string[] = [];
    private availableGens: string[] = [];

    // État de l'interface
    private currentPage = 1;
    private itemsPerPage = 20;
    private currentMode: ImageMode = 'artwork';
    private currentLang: Language = 'fr';

    // Filtres actuels
    private currentFilterType: PokemonType | 'all' = 'all';
    private currentFilterGen: string | 'all' = 'all';
    private currentSearchText: string = "";

    // Composants UI
    private header!: AppHeader;
    private modal!: PokeModal;
    
    // Gestion Async
    private currentRequestId = 0;
    // #endregion

    // #region DÉMARRAGE & INITIALISATION
    // ============================================================================

    constructor() {
        this.startApplication().catch(console.error);
    }

    private async startApplication() {
        this.initializeLayout();
        this.initializeHeader();
        this.initializeModal();
        await this.loadAllData();
        this.initializeControls();
        this.attachAllEvents();
    }

    private initializeLayout() { PokedexLayout.renderBaseLayout(); }

    private initializeHeader() {
        const headerEl = document.querySelector('app-header');
        if (headerEl instanceof AppHeader) {
            this.header = headerEl;
            this.header.onSettingsChange = (lang, mode) => this.onSettingsChange(lang, mode);
            this.header.setAttribute('lang', this.currentLang);
            this.header.setAttribute('mode', this.currentMode);
        }
    }

    private initializeModal() {
        let modalEl = document.querySelector('poke-modal');
        if (!modalEl) {
            modalEl = document.createElement('poke-modal');
            document.body.appendChild(modalEl);
        }
        this.modal = modalEl as PokeModal;
        this.modal.setAttribute('lang', this.currentLang);
        this.modal.setAttribute('mode', this.currentMode);
        this.modal.addEventListener('settings-change', (e: any) => this.onSettingsChange(e.detail.lang, e.detail.mode));
    }

    private async loadAllData() {
        try {
            const [types, gens, pokemons] = await Promise.all([
                PokemonAPI.getTypesList(),
                PokemonAPI.getGenerationsList(),
                PokemonAPI.getAllPokemonLite()
            ]);
            this.availableTypes = types;
            this.availableGens = gens;
            this.globalIndex = pokemons;
            
            this.filteredIds = this.globalIndex.map(p => p.id);
            await this.loadPage(1);
        } catch (e) { console.error("Erreur API", e); }
    }

    private initializeControls() {
        // Barre de recherche
        const searchContainer = document.getElementById('header-search');
        if (searchContainer && !searchContainer.querySelector('app-search')) {
            const searchComp = document.createElement('app-search') as AppSearch;
            searchComp.setAttribute('lang', this.currentLang);
            searchComp.onSearch = (text) => {
                // SÉCURITÉ : Si on est pas sur le Pokédex, on ignore la frappe
                if (this.currentView !== 'pokedex') return;
                
                this.currentSearchText = text;
                this.applyFilters();
            };
            searchContainer.appendChild(searchComp);
        }

        // Filtres (Type/Gen)
        const filterContainer = document.getElementById('header-filters');
        if (filterContainer && !filterContainer.querySelector('app-filter')) {
            const filterComp = document.createElement('app-filter') as AppFilter;
            filterComp.setAttribute('lang', this.currentLang);
            filterComp.typesList = this.availableTypes;
            filterComp.gensList = this.availableGens;
            filterComp.onFilter = (type, gen) => {
                // SÉCURITÉ : Si on est pas sur le Pokédex, on ignore le changement
                if (this.currentView !== 'pokedex') return;

                this.currentFilterType = type;
                this.currentFilterGen = gen;
                this.applyFilters();
            };
            filterContainer.appendChild(filterComp);
        }
    }
    // #endregion

    // #region NAVIGATION & CHARGEMENT DES PAGES
    // ============================================================================

    async loadPage(page: number) {
        // SÉCURITÉ SUPPLÉMENTAIRE
        if (this.currentView !== 'pokedex') return;

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
        
        PokedexLayout.renderGrid(this.currentPagePokemons, this.currentMode);
        PokedexLayout.updatePaginationUI(this.currentPage, totalPages, (p) => this.loadPage(p));
        
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

            PokedexLayout.renderGrid(this.currentPagePokemons, this.currentMode);
            this.modal.contextList = this.currentPagePokemons as Pokemon[];
        } catch (e) { console.error(e); }
    }
    // #endregion

    // #region FILTRAGE, SCORING & RECHERCHE
    // ============================================================================

    async applyFilters() {
        let candidates = this.globalIndex;

        // Filtres Techniques
        if (this.currentFilterType !== 'all') {
            const typeIds = await PokemonAPI.getIdsByType(this.currentFilterType);
            const typeSet = new Set(typeIds);
            candidates = candidates.filter(p => typeSet.has(p.id));
        }

        if (this.currentFilterGen !== 'all') {
            const genIds = await PokemonAPI.getIdsByGen(`generation-${this.currentFilterGen.toLowerCase()}`);
            const genSet = new Set(genIds);
            candidates = candidates.filter(p => genSet.has(p.id));
        }

        // Recherche Texte
        const searchText = this.normalizeText(this.currentSearchText);

        if (searchText) {
            const scoredCandidates = candidates.map(p => {
                return { pokemon: p, score: this.calculateMatchScore(p, searchText) };
            });

            const filteredScored = scoredCandidates.filter(item => item.score > 0);

            filteredScored.sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score;
                if (a.score >= 90) {
                    const idA = a.pokemon.id.toString();
                    const idB = b.pokemon.id.toString();
                    if (idA.length !== idB.length) return idA.length - idB.length;
                    return a.pokemon.id - b.pokemon.id;
                }
                const nameA = this.currentLang === 'fr' ? a.pokemon.name : (a.pokemon.nameEn || a.pokemon.name);
                const nameB = this.currentLang === 'fr' ? b.pokemon.name : (b.pokemon.nameEn || b.pokemon.name);
                return nameA.localeCompare(nameB);
            });

            this.filteredIds = filteredScored.map(item => item.pokemon.id);

        } else {
            candidates.sort((a, b) => a.id - b.id);
            this.filteredIds = candidates.map(p => p.id);
        }

        PokedexLayout.toggleEmptyState(this.filteredIds.length === 0);
        await this.loadPage(1);
    }

    private calculateMatchScore(p: PokemonLite, search: string): number {
        const idStr = p.id.toString();
        if (idStr === search) return 100;
        if (idStr.startsWith(search)) return 90;

        const lang = this.currentLang;
        const isFr = lang === 'fr';

        const targetName = isFr ? p.name : (p.nameEn || p.name);
        const targetAbilities = isFr ? (p.abilities?.fr || []) : (p.abilities?.en || []);

        const normName = this.normalizeText(targetName);

        if (normName.startsWith(search)) return 80;
        if (normName.includes(search)) return 60;
        
        const hasAbilityMatch = targetAbilities.some(t => this.normalizeText(t).includes(search));
        if (hasAbilityMatch) return 50;

        if (idStr.includes(search)) return 40;

        return 0;
    }

    private normalizeText(str: string): string {
        return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    }
    // #endregion

    // #region GESTION DES PARAMÈTRES (SETTINGS)
    // ============================================================================
    private onSettingsChange(lang: Language, mode: ImageMode) {
        this.currentLang = lang;
        this.currentMode = mode;
        I18n.currentLang = lang;

        this.header?.setAttribute('lang', lang);
        this.header?.setAttribute('mode', mode);
        this.modal?.setAttribute('lang', lang);
        this.modal?.setAttribute('mode', mode);

        const searchComp = document.querySelector('app-search');
        if (searchComp) searchComp.setAttribute('lang', lang);
        const filterComp = document.querySelector('app-filter');
        if (filterComp) filterComp.setAttribute('lang', lang);

        window.dispatchEvent(new CustomEvent('settings:changed', {
            detail: { lang, mode }
        }));

        // Si on est dans le builder, on ne rafraichit pas la grille inutilement
        if (this.currentView === 'pokedex') {
            if (this.currentSearchText) {
                this.applyFilters();
            } else {
                PokedexLayout.renderGrid(this.currentPagePokemons, this.currentMode);
                const totalPages = Math.ceil(this.filteredIds.length / this.itemsPerPage) || 1;
                PokedexLayout.updatePaginationUI(this.currentPage, totalPages, (p) => this.loadPage(p));
            }
        }

        const battleModal = document.querySelector('battle-prep-modal') as any;
        if (battleModal && typeof battleModal.setMode === 'function') {
            battleModal.setMode(mode);
        }
    }
    // #endregion

    // #region ÉVÉNEMENTS
    // ============================================================================
    private attachAllEvents() {
        document.getElementById('btn-prev-top')?.addEventListener('click', () => this.loadPage(this.currentPage - 1));
        document.getElementById('btn-next-top')?.addEventListener('click', () => this.loadPage(this.currentPage + 1));
        
        document.getElementById('pokedex-list')?.addEventListener('click', (e) => this.handleGridClick(e));
        document.body.addEventListener('click', (e) => this.handleTeamMemberClick(e));
        
        globalThis.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        document.body.addEventListener('open-teams', () => this.showTeamBuilder());
        document.body.addEventListener('navigate-home', () => this.showPokedex());
    }

    private async handleGridClick(e: Event) {
        const cardComponent = (e.target as HTMLElement).closest('poke-card') as HTMLElement;
        if (!cardComponent) return;
        const id = Number(cardComponent.dataset.id);
        const p = this.currentPagePokemons.find(x => x.id === id);
        
        if (p) {
            this.modal.contextList = this.currentPagePokemons as Pokemon[];
            if ('moves' in p) this.modal.open(p as Pokemon);
            else {
                try {
                    const full = await PokemonAPI.getPokemonDetails(id);
                    const idx = this.currentPagePokemons.findIndex(x => x.id === id);
                    if (idx !== -1) this.currentPagePokemons[idx] = full;
                    this.modal.open(full);
                } catch (err) { console.error(err); }
            }
        }
    }

    private async handleTeamMemberClick(e: Event) {
        const target = e.target as HTMLElement;
        if (target.closest('.remove-btn')) return;

        const slot = target.closest('.roster-slot.filled') as HTMLElement;
        if (slot) {
            const btn = slot.querySelector('.remove-btn') as HTMLElement;
            const teamId = btn?.dataset.team;
            const index = Number(btn?.dataset.index);
            
            if (teamId) {
                const team = TeamService.getTeams().find(t => t.id === teamId);
                const pokeLite = team?.members[index];
                if (team && pokeLite) {
                    const members = team.members.filter(m => m !== null) as PokemonLite[];
                    this.modal.contextList = members as unknown as Pokemon[];
                    try {
                        const full = await PokemonAPI.getPokemonDetails(pokeLite.id);
                        this.modal.open(full);
                    } catch (err) { console.error(err); }
                }
            }
        }
    }

    private handleKeyboard(e: KeyboardEvent) {
        // BLOCAGE CLAVIER SI BUILDER OU MODALE
        if (this.currentView !== 'pokedex') return;
        if (this.modal.getAttribute('open') === 'true') return;
        
        const total = Math.ceil(this.filteredIds.length / this.itemsPerPage);
        if (e.key === 'ArrowLeft' && this.currentPage > 1) this.loadPage(this.currentPage - 1);
        if (e.key === 'ArrowRight' && this.currentPage < total) this.loadPage(this.currentPage + 1);
    }

    // Gestion des vues
    showTeamBuilder() {
        this.currentView = 'builder';

        document.getElementById('pokedex-list')!.style.display = 'none';
        (document.querySelector('.pagination-controls') as HTMLElement).style.display = 'none';
        
        // On cache les contrôles de recherche et filtre pour éviter la confusion
        const search = document.getElementById('header-search');
        const filters = document.getElementById('header-filters');
        if (search) search.style.visibility = 'hidden';
        if (filters) filters.style.visibility = 'hidden';

        let builder = document.querySelector('team-builder-page') as HTMLElement;
        if (!builder) {
            builder = document.createElement('team-builder-page');
            document.getElementById('app')?.appendChild(builder);
        }
        builder.style.display = 'block';
        this.header.setViewMode('builder');
    }

    showPokedex() {
        this.currentView = 'pokedex';

        (document.querySelector('team-builder-page') as HTMLElement).style.display = 'none';
        document.getElementById('pokedex-list')!.style.display = 'grid';
        (document.querySelector('.pagination-controls') as HTMLElement).style.display = 'flex';
        
        // On réaffiche les contrôles
        const search = document.getElementById('header-search');
        const filters = document.getElementById('header-filters');
        if (search) search.style.visibility = 'visible';
        if (filters) filters.style.visibility = 'visible';

        this.header.setViewMode('pokedex');
    }
    // #endregion
}