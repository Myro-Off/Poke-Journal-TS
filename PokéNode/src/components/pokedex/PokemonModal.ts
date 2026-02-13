import type { Pokemon, ImageMode, EvolutionNode, Language } from '../../types/model';
import { PokemonAPI } from '../../core/api';
import { ModalTemplates } from './modal/ModalTemplates';
import { ModalAudio } from './modal/ModalAudio';
import { MediaHandler } from '../../utils/MediaHandler';
import { I18n } from '../../services/I18n';

export class PokeModal extends HTMLElement {

    // #region CONFIGURATION & ÉTAT
    // ============================================================================
    static get observedAttributes() { return ['lang', 'mode', 'open']; }

    private _navigationList: Pokemon[] = [];
    private currentIndex: number = -1;
    
    private activePokemon: Pokemon | null = null;
    private evolutionChain: EvolutionNode | null = null;
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        if (!this.querySelector('.modal-content')) {
            this.renderLayout();
            this.bindGlobalEvents();
        }
    }

    attributeChangedCallback(name: string, prev: string, next: string) {
        if (prev === next) return;

        if (name === 'open') {
            this.handleOpenStateChange(next === 'true');
        }

        if ((name === 'lang' || name === 'mode') && this.isOpen() && this.activePokemon) {
            this.updateSwitchState();
            this.refreshViewWithoutAnimation();
            this.loadDynamicData(this.activePokemon);
        }
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    public open(pokemon: Pokemon) {
        this.activePokemon = pokemon;
        this.evolutionChain = null;
        this.currentIndex = this._navigationList.findIndex(p => p.id === pokemon.id);
        
        this.setAttribute('open', 'true');
        this.style.display = 'flex';
        
        this.renderContent(); 
        this.loadDynamicData(pokemon);
    }

    public close() {
        this.setAttribute('open', 'false');
        this.style.display = 'none';
    }

    set navigationList(list: Pokemon[]) {
        this._navigationList = list;
    }
    // #endregion

    // #region LOGIQUE D'ÉTAT
    // ============================================================================
    private isOpen(): boolean {
        return this.getAttribute('open') === 'true';
    }

    private get currentLang(): Language {
        return (this.getAttribute('lang') as Language) || 'fr';
    }

    private get currentMode(): ImageMode {
        return (this.getAttribute('mode') as ImageMode) || 'artwork';
    }

    private handleOpenStateChange(isOpen: boolean) {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        this.style.display = isOpen ? 'flex' : 'none';
        if (isOpen) ModalAudio.playPaperSound();
    }

    private updateSwitchState() {
        const langIn = this.querySelector('#modal-toggle-lang') as HTMLInputElement;
        const modeIn = this.querySelector('#modal-toggle-mode') as HTMLInputElement;
        
        if (langIn) langIn.checked = (this.currentLang === 'en');
        if (modeIn) modeIn.checked = (this.currentMode === 'legacy');
    }
    // #endregion

    // #region RENDU & MISE À JOUR
    // ============================================================================
    private renderLayout() {
        this.innerHTML = ModalTemplates.getBaseHTML(this.currentLang, this.currentMode);
    }

    private renderContent() {
        if (!this.activePokemon) return;
        
        const body = this.querySelector('#modal-body');
        if (!body) return;

        body.innerHTML = ModalTemplates.getPokemonContentHTML(
            this.activePokemon, 
            this.currentMode, 
            this.currentLang, 
            this.evolutionChain
        );

        ModalAudio.setupCry(this.activePokemon, this.currentMode);
        if (this.evolutionChain) this.bindEvolutionClicks();
    }

    private refreshViewWithoutAnimation() {
        if (!this.activePokemon) return;
        const p = this.activePokemon;

        const img = this.querySelector('#modal-main-img') as HTMLImageElement;
        if (img) {
            const newSrc = MediaHandler.getModalImage(p, this.currentMode);
            if (img.src !== newSrc) img.src = newSrc;
            img.className = `modal-pokemon-img ${this.currentMode === 'legacy' ? 'pixelated' : ''}`;
        }

        const nameEl = this.querySelector('#modal-title-name');
        if (nameEl) nameEl.textContent = this.currentLang === 'fr' ? p.name.fr : p.name.en;

        const descEl = this.querySelector('.flavor-text');
        if (descEl) descEl.textContent = `"${this.currentLang === 'fr' ? p.description.fr : p.description.en}"`;
        
        const statsList = this.querySelector('#modal-stats-list');
        if (statsList) statsList.innerHTML = ModalTemplates.generateStatsHTML(p.stats);

        if (this.evolutionChain) this.renderEvolutionTree(this.evolutionChain);

        const typesContainer = this.querySelector('.modal-types');
        if (typesContainer) {
            const typesHTML = p.types.map(t => `<span class="type-badge type-${t}">${I18n.translateType(t)}</span>`).join('');
            typesContainer.innerHTML = typesHTML + `
                <div id="cry-container">
                     <button id="play-cry" class="cry-pill" disabled style="opacity: 0.6; cursor: wait;">
                        <span class="cry-icon"><span class="speaker-base"></span><span class="sound-waves"><span></span><span></span><span></span></span></span>
                        <span class="cry-label" style="font-weight:bold; margin-left:5px;">${I18n.t('cry')}</span>
                    </button>
                </div>
            `;
            ModalAudio.setupCry(p, this.currentMode);
        }

        this.updateMetaLabels();
    }

    private updateMetaLabels() {
        const labels = this.querySelectorAll('.meta-label');
        const keys = ['generation', 'region', 'height', 'weight', 'abilities'];
        labels.forEach((label, i) => { if (keys[i]) label.textContent = I18n.t(keys[i] as any); });

        const effTitles = this.querySelectorAll('.eff-title');
        if (effTitles[0]) effTitles[0].textContent = I18n.t('weaknesses');
        if (effTitles[1]) effTitles[1].textContent = I18n.t('resistances');
    }
    // #endregion

    // #region INTERACTIONS
    // ============================================================================
    private bindGlobalEvents() {
        // Clic sur l'overlay (vide) pour fermer
        this.addEventListener('click', (e) => {
            const modalContent = this.querySelector('.modal-content');
            if (e.target === this || (modalContent && !modalContent.contains(e.target as Node))) {
                this.close();
            }
        });

        // Bouton fermer
        this.querySelector('#close-modal')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        // Navigation
        this.querySelector('#prev-pokemon')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateCarousel(-1);
        });
        this.querySelector('#next-pokemon')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateCarousel(1);
        });

        // Toggles
        const toggleHandler = () => {
            const lang = (this.querySelector('#modal-toggle-lang') as HTMLInputElement).checked ? 'en' : 'fr';
            const mode = (this.querySelector('#modal-toggle-mode') as HTMLInputElement).checked ? 'legacy' : 'artwork';
            I18n.currentLang = lang;
            this.setAttribute('lang', lang);
            this.setAttribute('mode', mode);
            this.dispatchEvent(new CustomEvent('settings-change', { detail: { lang, mode }, bubbles: true }));
        };

        this.querySelector('#modal-toggle-lang')?.addEventListener('change', toggleHandler);
        this.querySelector('#modal-toggle-mode')?.addEventListener('change', toggleHandler);

        // Clavier
        globalThis.addEventListener('keydown', (e) => {
            if (this.isOpen()) {
                if (e.key === 'Escape') this.close();
                if (e.key === 'ArrowLeft') this.navigateCarousel(-1);
                if (e.key === 'ArrowRight') this.navigateCarousel(1);
            }
        });
    }

    private bindEvolutionClicks() {
        this.querySelectorAll('.clickable-evo').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPokemonById(Number((e.currentTarget as HTMLElement).dataset.id));
            });
        });
    }

    private navigateCarousel(dir: number) {
        if (this._navigationList.length === 0) return;
        let newIdx = (this.currentIndex + dir + this._navigationList.length) % this._navigationList.length;
        this.open(this._navigationList[newIdx]);
    }

    private openPokemonById(id: number) {
        const existing = this._navigationList.find(p => p.id === id);
        if (existing) this.open(existing);
        else PokemonAPI.getPokemonDetails(id).then(p => this.open(p));
    }
    // #endregion

    // #region DATA LOADING
    private async loadDynamicData(pokemon: Pokemon) {
        try {
            if (this.activePokemon?.id !== pokemon.id) return;
            const abilities = await Promise.all(pokemon.abilities.map(a => PokemonAPI.getAbilityTranslation(a, this.currentLang)));
            const metaVal = this.querySelector('.meta-value-abilities');
            if (metaVal) metaVal.textContent = abilities.join(', ');

            const htmls = ModalTemplates.getEfficaciesHTML(pokemon.types);
            const weakList = this.querySelector('#modal-weak-list');
            const resistList = this.querySelector('#modal-resist-list');
            if (weakList) weakList.innerHTML = htmls.weak;
            if (resistList) resistList.innerHTML = htmls.resist;

            if (!this.evolutionChain || this.evolutionChain.id !== pokemon.id) {
                 this.evolutionChain = await PokemonAPI.getEvolutionChain(pokemon.evolutionUrl);
            }
            if (this.evolutionChain) {
                await this.localizeEvolutionTree(this.evolutionChain);
                this.renderEvolutionTree(this.evolutionChain);
            }
        } catch (e) { console.error(e); }
    }

    private renderEvolutionTree(chain: EvolutionNode) {
        const container = this.querySelector('#modal-evo-content');
        if (container) {
            container.innerHTML = `<div class="evo-tree-container" style="display:flex; justify-content:center; overflow-x:auto; padding:10px;">${ModalTemplates.buildEvolutionHTML(chain, this.currentMode)}</div>`;
            this.bindEvolutionClicks();
        }
    }

    private async localizeEvolutionTree(node: EvolutionNode): Promise<void> {
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${node.id}`);
            const data = await res.json() as any;
            const name = data.names.find((n: any) => n.language.name === this.currentLang)?.name;
            if (name) node.name = name;
        } catch {}
        if (node.evolvesTo?.length > 0) await Promise.all(node.evolvesTo.map(child => this.localizeEvolutionTree(child)));
    }
    // #endregion
}

customElements.define('poke-modal', PokeModal);