import type { ImageMode, Language } from '../../types/model';

export class AppHeader extends HTMLElement {

    /* ==========================================================================
       1. CONFIGURATION
       ========================================================================== */

    // @ts-ignore : Utilisé nativement par le navigateur
    static get observedAttributes() {
        return ['lang', 'mode'];
    }

    // Callback pour prévenir le Controller
    public onSettingsChange?: (lang: Language, mode: ImageMode) => void;

    /* ==========================================================================
       2. CYCLE DE VIE
       ========================================================================== */

    // @ts-ignore
    connectedCallback() {
        // On ne dessine le HTML que s'il est vide, afin d'éviter d'écraser les valeurs existantes
        if (!this.innerHTML.trim()) {
            this.render();
            this.attachEvents();
        }

        // On synchronise les checkboxes avec les attributs actuels
        this.updateCheckboxesFromAttributes();
    }

    /**
     * Appelé quand on fait setAttribute('lang', 'en') depuis l'extérieur
     */
    // @ts-ignore
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        // Optimisation : On ne fait rien si la valeur est la même
        if (oldValue !== newValue) {
            this.updateCheckboxesFromAttributes();
        }
    }

    /* ==========================================================================
       3. INTERNE : MISE À JOUR VISUELLE
       ========================================================================== */

    /**
     * Met à jour l'état visuel des inputs sans recharger tout le HTML.
     * Pour éviter d'écraser les éléments injectés (Search/Filter).
     */
    private updateCheckboxesFromAttributes() {
        const langInput = this.querySelector('#header-toggle-lang') as HTMLInputElement;
        const modeInput = this.querySelector('#header-toggle-mode') as HTMLInputElement;

        // Si le HTML n'est pas encore prêt, on sort
        if (!langInput || !modeInput) return;

        const currentLang = this.getAttribute('lang') || 'fr';
        const currentMode = this.getAttribute('mode') || 'artwork';

        // Mise à jour des checkboxes (checked = EN ou Legacy)
        langInput.checked = (currentLang === 'en');
        modeInput.checked = (currentMode === 'legacy');
    }

    /* ==========================================================================
       4. RENDU & ÉVÉNEMENTS
       ========================================================================== */

    private render() {
        const lang = this.getAttribute('lang') || 'fr';
        const mode = this.getAttribute('mode') || 'artwork';

        this.innerHTML = `
            <div class="header-inner">
                <div class="header-brand">
                    <h1>Poké <span style="color:var(--ink-accent)">Journal</span></h1>
                </div>

                <div class="header-controls">
                    <div id="header-search"></div>
                    <div id="header-filters"></div>
                </div>

                <div class="header-settings">
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

    private attachEvents() {
        const langInput = this.querySelector('#header-toggle-lang');
        const modeInput = this.querySelector('#header-toggle-mode');

        const notifyChange = () => {
            // Lecture de l'état des inputs
            const isEn = (langInput as HTMLInputElement).checked;
            const isLegacy = (modeInput as HTMLInputElement).checked;

            const newLang: Language = isEn ? 'en' : 'fr';
            const newMode: ImageMode = isLegacy ? 'legacy' : 'artwork';

            this.setAttribute('lang', newLang);
            this.setAttribute('mode', newMode);

            // On prévient le Controller
            if (this.onSettingsChange) {
                this.onSettingsChange(newLang, newMode);
            }
        };

        langInput?.addEventListener('change', notifyChange);
        modeInput?.addEventListener('change', notifyChange);
    }
}

customElements.define('app-header', AppHeader);
