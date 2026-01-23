import { I18n } from '../../services/I18n';

export class AppSearch extends HTMLElement {

    /* ==========================================================================
       1. CONFIGURATION
       ========================================================================== */

    // @ts-ignore
    static get observedAttributes() { return ['lang']; }

    public onSearch?: (text: string) => void;

    /* ==========================================================================
       2. CYCLE DE VIE
       ========================================================================== */

    // @ts-ignore
    connectedCallback() {
        if (!this.innerHTML.trim()) {
            this.render();
            this.attachEvents();
        }
    }

    // @ts-ignore
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'lang' && oldValue !== newValue) {
            const input = this.querySelector('input');
            if (input) {
                input.placeholder = I18n.t('search_placeholder');
            }
        }
    }

    /* ==========================================================================
       3. API PUBLIQUE
       ========================================================================== */

    set value(val: string) {
        const input = this.querySelector('input');
        if (input) input.value = val;
    }

    // @ts-ignore
    get value(): string {
        const input = this.querySelector('input');
        return input ? input.value : '';
    }

    /* ==========================================================================
       4. RENDU
       ========================================================================== */

    private render() {
        this.innerHTML = `
            <div class="search-wrapper">
                <input type="text" 
                       id="search-input-field" 
                       class="search-input" 
                       placeholder="${I18n.t('search_placeholder')}" 
                       autocomplete="off">
            </div>
        `;
    }

    private attachEvents() {
        const input = this.querySelector('input');
        input?.addEventListener('input', (e: Event) => {
            const text = (e.target as HTMLInputElement).value.trim();
            if (this.onSearch) this.onSearch(text);
        });
    }
}

customElements.define('app-search', AppSearch);
