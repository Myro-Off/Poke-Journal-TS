import type { ImageMode, Language } from '../../types/model';

export class AppHeader extends HTMLElement {

    // #region CONFIGURATION & ÉTAT
    // ============================================================================
    static get observedAttributes() {
        return ['lang', 'mode'];
    }

    private currentView: 'pokedex' | 'builder' = 'pokedex';
    public onSettingsChange?: (lang: Language, mode: ImageMode) => void;
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        if (!this.hasChildNodes()) {
            this.renderLayout();
            this.attachEventListeners();
        }
        
        this.synchronizeStateWithUI();
        this.listenToGlobalSettings();
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    public setViewMode(mode: 'pokedex' | 'builder') {
        this.currentView = mode;
        this.updateNavigationButtonState(mode);
    }
    // #endregion

    // #region RENDU
    // ============================================================================
    private renderLayout() {
        const lang = this.getAttribute('lang') || 'fr';
        const mode = this.getAttribute('mode') || 'artwork';

        this.innerHTML = /*html*/ `
            <div class="header-inner">
                <div class="header-brand">
                    <h1>Poké <span style="color:var(--ink-accent)">Journal</span></h1>
                </div>

                <div class="header-controls">
                    <div id="header-search"></div>
                    <div id="header-filters"></div>
                </div>

                <div class="header-settings">
                    ${this.buildNavigationButtonHTML()}
                    ${this.buildLangSwitchHTML(lang === 'en')}
                    ${this.buildModeSwitchHTML(mode === 'legacy')}
                </div>
            </div>
        `;
    }

    private buildNavigationButtonHTML(): string {
        return /*html*/ `
            <button id="open-team-builder" class="action-pill-btn" title="Gérer mes équipes">
                <span class="icon">📜</span> 
                <span class="label">Équipes</span>
            </button>
        `;
    }

    private buildLangSwitchHTML(isEnglish: boolean): string {
        return /*html*/ `
            <div class="switch-container">
                <label class="poke-switch">
                    <input type="checkbox" id="header-toggle-lang" ${isEnglish ? 'checked' : ''}>
                    <span class="poke-slider"></span>
                    <span class="switch-label">FR</span>
                    <span class="switch-label">EN</span>
                </label>
            </div>
        `;
    }

    private buildModeSwitchHTML(isLegacy: boolean): string {
        return /*html*/ `
            <div class="switch-container">
                <label class="poke-switch">
                    <input type="checkbox" id="header-toggle-mode" ${isLegacy ? 'checked' : ''}>
                    <span class="poke-slider"></span>
                    <span class="switch-label">HD</span>
                    <span class="switch-label">Pix</span>
                </label>
            </div>
        `;
    }
    // #endregion

    // #region LOGIQUE UI & ÉTAT
    // ============================================================================
    private synchronizeStateWithUI() {
        const langInput = this.querySelector('#header-toggle-lang') as HTMLInputElement;
        const modeInput = this.querySelector('#header-toggle-mode') as HTMLInputElement;
        
        if (!langInput || !modeInput) return;

        const currentLang = this.getAttribute('lang') || 'fr';
        const currentMode = this.getAttribute('mode') || 'artwork';

        langInput.checked = (currentLang === 'en');
        modeInput.checked = (currentMode === 'legacy');
    }

    private updateNavigationButtonState(mode: 'pokedex' | 'builder') {
        const btn = this.querySelector('#open-team-builder');
        if (!btn) return;

        const iconSpan = btn.querySelector('.icon');
        const labelSpan = btn.querySelector('.label');

        if (mode === 'pokedex') {
            if (iconSpan) iconSpan.textContent = '📜';
            if (labelSpan) labelSpan.textContent = 'Équipes';
            btn.classList.remove('active-mode');
            btn.setAttribute('title', 'Gérer mes équipes');
        } else {
            if (iconSpan) {
                iconSpan.innerHTML = /*html*/ `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                    style="width:20px; height:20px; vertical-align:middle; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">`;
            }
            if (labelSpan) labelSpan.textContent = 'Pokédex';
            btn.classList.add('active-mode');
            btn.setAttribute('title', 'Retour au Pokédex');
        }
    }
    // #endregion

    // #region INTERACTIONS
    // ============================================================================
    private attachEventListeners() {
        this.bindSettingsChange();
        this.bindNavigationClick();
    }

    private bindSettingsChange() {
        const langInput = this.querySelector('#header-toggle-lang') as HTMLInputElement;
        const modeInput = this.querySelector('#header-toggle-mode') as HTMLInputElement;

        const notifyChange = () => {
            const newLang: Language = langInput.checked ? 'en' : 'fr';
            const newMode: ImageMode = modeInput.checked ? 'legacy' : 'artwork';

            this.setAttribute('lang', newLang);
            this.setAttribute('mode', newMode);

            if (this.onSettingsChange) {
                this.onSettingsChange(newLang, newMode);
            }
        };

        langInput?.addEventListener('change', notifyChange);
        modeInput?.addEventListener('change', notifyChange);
    }

    private bindNavigationClick() {
        this.querySelector('#open-team-builder')?.addEventListener('click', () => {
            const eventName = this.currentView === 'pokedex' ? 'open-teams' : 'navigate-home';
            this.dispatchEvent(new CustomEvent(eventName, {
                bubbles: true,
                composed: true
            }));
        });
    }

    private listenToGlobalSettings() {
        globalThis.addEventListener('settings:changed', (e: Event) => {
            const evt = e as CustomEvent<{ mode: ImageMode, lang: Language }>;
            
            this.setAttribute('lang', evt.detail.lang);
            this.setAttribute('mode', evt.detail.mode);

            this.synchronizeStateWithUI();
        });
    }
    // #endregion
}

customElements.define('app-header', AppHeader);