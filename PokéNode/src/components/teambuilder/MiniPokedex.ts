import { PokemonAPI } from '../../core/api';
import type { PokemonLite, ImageMode, Language } from '../../types/model';
import { TeamService } from '../../services/TeamService';
import { I18n } from '../../services/I18n';

export class MiniPokedex extends HTMLElement {

    // #region PROPRIÉTÉS & ÉTAT
    // ============================================================================
    private allPokemons: PokemonLite[] = [];
    private filteredPokemons: PokemonLite[] = [];
    private displayedPokemons: PokemonLite[] = [];

    private context = {
        teamId: null as string | null,
        slotIndex: null as number | null
    };

    private pagination = {
        currentPage: 1,
        itemsPerPage: 20,
        totalPages: 1
    };

    private settings = {
        mode: 'artwork' as ImageMode,
        lang: 'fr' as Language
    };

    private handleKeydownBound = this.handleKeydown.bind(this);
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    async connectedCallback() {
        this.hide();
        await this.loadData();
        this.initializeSettings();
        this.renderLayout();
        this.bindEvents();
    }

    private async loadData() {
        this.allPokemons = await PokemonAPI.getAllPokemonLite();
        this.filteredPokemons = [...this.allPokemons];
    }

    private initializeSettings() {
        const header = document.querySelector('app-header');
        if (header) {
            this.settings.mode = (header.getAttribute('mode') as ImageMode) || 'artwork';
            this.settings.lang = (header.getAttribute('lang') as Language) || 'fr';
        }
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    public open(teamId: string, slotIndex: number) {
        this.context.teamId = teamId;
        this.context.slotIndex = slotIndex;

        this.resetState();
        this.show();
        this.syncCheckboxes();
        this.updateStaticTexts();
        this.refreshView();

        setTimeout(() => this.querySelector('input')?.focus(), 50);
    }

    public close() {
        this.hide();
        this.resetContext();
    }
    // #endregion

    // #region GESTION DE L'AFFICHAGE
    // ============================================================================
    private show() {
        this.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        globalThis.addEventListener('keydown', this.handleKeydownBound);
        
        const header = document.querySelector('app-header');
        if (header) {
            this.settings.mode = (header.getAttribute('mode') as ImageMode) || 'artwork';
            this.settings.lang = (header.getAttribute('lang') as Language) || 'fr';
        }
    }

    private hide() {
        this.style.display = 'none';
        document.body.style.overflow = '';
        globalThis.removeEventListener('keydown', this.handleKeydownBound);
    }

    private resetState() {
        this.pagination.currentPage = 1;
        this.filteredPokemons = [...this.allPokemons];
        const input = this.querySelector('#mini-search') as HTMLInputElement;
        if (input) input.value = '';
    }

    private resetContext() {
        this.context.teamId = null;
        this.context.slotIndex = null;
    }

    private syncCheckboxes() {
        const langIn = this.querySelector('#mini-toggle-lang') as HTMLInputElement;
        const modeIn = this.querySelector('#mini-toggle-mode') as HTMLInputElement;
        if (langIn) langIn.checked = (this.settings.lang === 'en');
        if (modeIn) modeIn.checked = (this.settings.mode === 'legacy');
    }
    // #endregion

    // #region LOGIQUE DE FILTRAGE & PAGINATION
    // ============================================================================
    private filterList(searchTerm: string) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredPokemons = [...this.allPokemons];
        } else {
            this.filteredPokemons = this.allPokemons.filter(p => 
                p.name.toLowerCase().includes(term) ||
                (p.nameEn && p.nameEn.toLowerCase().includes(term)) ||
                p.id.toString().includes(term)
            );
        }

        this.pagination.currentPage = 1;
        this.refreshView();
    }

    private updatePagination() {
        this.pagination.totalPages = Math.ceil(this.filteredPokemons.length / this.pagination.itemsPerPage) || 1;
        
        if (this.pagination.currentPage < 1) this.pagination.currentPage = 1;
        if (this.pagination.currentPage > this.pagination.totalPages) this.pagination.currentPage = this.pagination.totalPages;

        const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const end = start + this.pagination.itemsPerPage;
        
        this.displayedPokemons = this.filteredPokemons.slice(start, end);
    }

    private nextPage() {
        if (this.pagination.currentPage < this.pagination.totalPages) {
            this.pagination.currentPage++;
            this.refreshView();
        }
    }

    private prevPage() {
        if (this.pagination.currentPage > 1) {
            this.pagination.currentPage--;
            this.refreshView();
        }
    }
    // #endregion

    // #region RENDU
    // ============================================================================
    private renderLayout() {
        this.innerHTML = /*html*/ `
            <div class="mini-dex-modal">
                <div class="mini-dex-content">
                    <header class="mini-dex-header">
                        <h3 id="mini-title"></h3>
                        
                        <div class="mini-settings" style="display:flex; gap:10px; align-items:center; margin: 0 15px 0 auto;">
                            <div class="switch-container">
                                <label class="poke-switch">
                                    <input type="checkbox" id="mini-toggle-lang">
                                    <span class="poke-slider"></span>
                                    <span class="switch-label">FR</span>
                                    <span class="switch-label">EN</span>
                                </label>
                            </div>
                            <div class="switch-container">
                                <label class="poke-switch">
                                    <input type="checkbox" id="mini-toggle-mode">
                                    <span class="poke-slider"></span>
                                    <span class="switch-label">HD</span>
                                    <span class="switch-label">Pix</span>
                                </label>
                            </div>
                        </div>

                        <button class="mini-close-btn"></button>
                    </header>
                    
                    <div class="mini-search-wrapper">
                        <input type="text" id="mini-search" autocomplete="off">
                    </div>

                    <div class="mini-dex-grid" id="mini-dex-grid"></div>

                    <div class="mini-pagination">
                        <button id="mini-prev" class="mini-page-btn">←</button>
                        <span id="mini-page-info">1 / 1</span>
                        <button id="mini-next" class="mini-page-btn">→</button>
                    </div>
                </div>
            </div>
        `;
        this.updateStaticTexts();
    }

    private updateStaticTexts() {
        const title = this.querySelector('#mini-title');
        const searchInput = this.querySelector('#mini-search') as HTMLInputElement;
        const closeBtn = this.querySelector('.mini-close-btn') as HTMLElement;

        if (title) title.textContent = I18n.getText('recruit_title' as any);
        if (searchInput) searchInput.placeholder = `${I18n.getText('search_placeholder_short' as any)}...`;
        if (closeBtn) closeBtn.title = I18n.getText('close' as any);
    }

    private refreshView() {
        this.updatePagination();
        this.renderGrid();
        this.updatePaginationUI();
    }

    private renderGrid() {
        const grid = this.querySelector('#mini-dex-grid');
        if (!grid) return;

        if (this.displayedPokemons.length === 0) {
            grid.innerHTML = /*html*/ `<div style="grid-column:1/-1; text-align:center; color:#888; padding:20px; font-family:var(--font-hand);">Aucun Pokémon trouvé.</div>`;
            return;
        }

        grid.innerHTML = this.displayedPokemons.map(p => this.buildCardHTML(p)).join('');
        this.bindGridEvents(grid);
    }

    private buildCardHTML(p: PokemonLite): string {
        const imgUrl = this.settings.mode === 'legacy'
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;

        const pixelClass = this.settings.mode === 'legacy' ? 'pixelated' : '';
        const name = this.settings.lang === 'fr' ? p.name : (p.nameEn || p.name);

        return /*html*/ `
            <div class="mini-card" data-id="${p.id}">
                <img src="${imgUrl}" class="${pixelClass}" loading="lazy" alt="${name}">
                <span class="mini-name">${name}</span>
            </div>
        `;
    }

    private updatePaginationUI() {
        const pageInfo = this.querySelector('#mini-page-info');
        const prevBtn = this.querySelector('#mini-prev') as HTMLButtonElement;
        const nextBtn = this.querySelector('#mini-next') as HTMLButtonElement;

        if (pageInfo) pageInfo.textContent = `${this.pagination.currentPage} / ${this.pagination.totalPages}`;
        if (prevBtn) prevBtn.disabled = this.pagination.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.pagination.currentPage === this.pagination.totalPages;
    }
    // #endregion

    // #region INTERACTIONS
    // ============================================================================
    private onPokemonSelected(id: number) {
        const pokemon = this.allPokemons.find(p => p.id === id);

        if (pokemon && this.context.teamId && this.context.slotIndex !== null) {
            TeamService.updateMember(this.context.teamId, this.context.slotIndex, pokemon);
            this.close();
        }
    }

    private handleKeydown(e: KeyboardEvent) {
        if (this.style.display === 'none') return;

        switch(e.key) {
            case 'Escape': this.close(); break;
            case 'ArrowLeft': this.prevPage(); break;
            case 'ArrowRight': this.nextPage(); break;
        }
    }

    private bindEvents() {
        this.querySelector('#mini-search')?.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value;
            this.filterList(val);
        });

        this.querySelector('#mini-prev')?.addEventListener('click', () => this.prevPage());
        this.querySelector('#mini-next')?.addEventListener('click', () => this.nextPage());

        this.querySelector('.mini-close-btn')?.addEventListener('click', () => this.close());
        
        this.querySelector('.mini-dex-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.close();
        });

        // Gestion des nouveaux switchs
        const toggleHandler = () => {
            const langIn = this.querySelector('#mini-toggle-lang') as HTMLInputElement;
            const modeIn = this.querySelector('#mini-toggle-mode') as HTMLInputElement;
            
            const newLang: Language = langIn.checked ? 'en' : 'fr';
            const newMode: ImageMode = modeIn.checked ? 'legacy' : 'artwork';

            this.settings.lang = newLang;
            this.settings.mode = newMode;
            I18n.currentLang = newLang;

            window.dispatchEvent(new CustomEvent('settings:changed', {
                detail: { lang: newLang, mode: newMode }
            }));
            
            this.updateStaticTexts();
            this.refreshView();
        };

        this.querySelector('#mini-toggle-lang')?.addEventListener('change', toggleHandler);
        this.querySelector('#mini-toggle-mode')?.addEventListener('change', toggleHandler);

        globalThis.addEventListener('settings:changed', (e: Event) => {
            const evt = e as CustomEvent<{ mode: ImageMode, lang: Language }>;
            this.settings.mode = evt.detail.mode;
            this.settings.lang = evt.detail.lang;
            this.syncCheckboxes();
            
            if (this.style.display === 'flex') {
                this.updateStaticTexts();
                this.refreshView();
            }
        });
    }

    private bindGridEvents(grid: Element) {
        grid.querySelectorAll('.mini-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = Number((card as HTMLElement).dataset.id);
                this.onPokemonSelected(id);
            });
        });
    }
    // #endregion
}

customElements.define('mini-pokedex', MiniPokedex);