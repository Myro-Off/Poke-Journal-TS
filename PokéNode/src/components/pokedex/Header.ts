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
        if (!this.innerHTML.trim()) {
            this.render();
            this.attachEvents();
        }
        this.updateCheckboxesFromAttributes();
    }

    attributeChangedCallback(oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            this.updateCheckboxesFromAttributes();
        }
    }
    // #endregion

    // #region API PUBLIQUE (NAVIGATION)
    // ============================================================================
    public setViewMode(mode: 'pokedex' | 'builder') {
        this.currentView = mode;
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
                iconSpan.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                    style="width:20px; height:20px; vertical-align:middle; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">`;
            }
            if (labelSpan) labelSpan.textContent = 'Pokédex';
            btn.classList.add('active-mode');
            btn.setAttribute('title', 'Retour au Pokédex');
        }
    }
    // #endregion

    // #region LOGIQUE INTERNE & RENDU
    // ============================================================================
    private updateCheckboxesFromAttributes() {
        const langInput = this.querySelector('#header-toggle-lang') as HTMLInputElement;
        const modeInput = this.querySelector('#header-toggle-mode') as HTMLInputElement;
        if (!langInput || !modeInput) return;

        const currentLang = this.getAttribute('lang') || 'fr';
        const currentMode = this.getAttribute('mode') || 'artwork';

        langInput.checked = (currentLang === 'en');
        modeInput.checked = (currentMode === 'legacy');
    }

    private render() {
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
                    <button id="open-team-builder" class="action-pill-btn" title="Gérer mes équipes">
                        <span class="icon">📜</span> 
                        <span class="label">Équipes</span>
                    </button>

                    <div class="switch-container">
                        <label class="poke-switch">
                            <input type="checkbox" id="header-toggle-lang" ${lang === 'en' ? 'checked' : ''}>
                            <span class="poke-slider"></span>
                            <span class="switch-label">FR</span>
                            <span class="switch-label">EN</span>
                        </label>
                    </div>

                    <div class="switch-container">
                        <label class="poke-switch">
                            <input type="checkbox" id="header-toggle-mode" ${mode === 'legacy' ? 'checked' : ''}>
                            <span class="poke-slider"></span>
                            <span class="switch-label">HD</span>
                            <span class="switch-label">Pix</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
    // #endregion

    // #region GESTION DES ÉVÉNEMENTS
    // ============================================================================
    private attachEvents() {
        const langInput = this.querySelector('#header-toggle-lang');
        const modeInput = this.querySelector('#header-toggle-mode');
        const actionBtn = this.querySelector('#open-team-builder');

        const notifyChange = () => {
            const isEn = (langInput as HTMLInputElement).checked;
            const isLegacy = (modeInput as HTMLInputElement).checked;

            const newLang: Language = isEn ? 'en' : 'fr';
            const newMode: ImageMode = isLegacy ? 'legacy' : 'artwork';

            this.setAttribute('lang', newLang);
            this.setAttribute('mode', newMode);

            if (this.onSettingsChange) {
                this.onSettingsChange(newLang, newMode);
            }
        };

        langInput?.addEventListener('change', notifyChange);
        modeInput?.addEventListener('change', notifyChange);

        actionBtn?.addEventListener('click', () => {
            const eventName = this.currentView === 'pokedex' ? 'open-teams' : 'navigate-home';
            this.dispatchEvent(new CustomEvent(eventName, {
                bubbles: true,
                composed: true
            }));
        });
    }
    // #endregion
}

customElements.define('app-header', AppHeader);