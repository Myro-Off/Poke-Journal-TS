import { I18n } from '../../services/I18n';

export class AppSearch extends HTMLElement {

    // #region CONFIGURATION & ATTRIBUTS
    // ============================================================================
    static get observedAttributes() { 
        return ['lang']; 
    }
    
    public onSearch?: (text: string) => void;
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        if (!this.hasChildNodes()) {
            this.renderLayout();
            this.attachListeners();
        }
    }

    attributeChangedCallback(name: string, prev: string, next: string) {
        if (name === 'lang' && prev !== next) {
            this.updatePlaceholder();
        }
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    set value(text: string) {
        const input = this.getInputField();
        if (input) input.value = text;
    }

    get value(): string {
        return this.getInputField()?.value || '';
    }
    // #endregion

    // #region RENDU
    // ============================================================================
    private renderLayout() {
        this.innerHTML = /*html*/ `
            <div class="search-wrapper">
                <input type="text" 
                       id="search-input-field" 
                       class="search-input" 
                       placeholder="${I18n.t('search_placeholder')}" 
                       autocomplete="off">
            </div>
        `;
    }

    private updatePlaceholder() {
        const input = this.getInputField();
        if (input) {
            input.placeholder = I18n.t('search_placeholder');
        }
    }
    // #endregion

    // #region INTERACTIONS
    // ============================================================================
    private attachListeners() {
        this.getInputField()?.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            this.triggerSearch(target.value);
        });
    }

    private triggerSearch(rawText: string) {
        if (this.onSearch) {
            this.onSearch(rawText.trim());
        }
    }

    private getInputField(): HTMLInputElement | null {
        return this.querySelector('input');
    }
    // #endregion
}

customElements.define('app-search', AppSearch);