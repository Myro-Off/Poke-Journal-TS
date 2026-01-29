import { I18n } from '../../services/I18n';

export class AppSearch extends HTMLElement {

    // #region 1. Config & Attributes
    static get observedAttributes() { return ['lang']; }
    public onSearch?: (text: string) => void;
    // #endregion

    // #region 2. Lifecycle
    connectedCallback() {
        if (!this.innerHTML.trim()) {
            this.render();
            this.bindEvents();
        }
    }

    attributeChangedCallback(name: string, prev: string, next: string) {
        if (name === 'lang' && prev !== next) {
            const input = this.querySelector('input');
            if (input) input.placeholder = I18n.t('search_placeholder');
        }
    }
    // #endregion

    // #region 3. Public API
    set value(val: string) {
        const input = this.querySelector('input');
        if (input) input.value = val;
    }

    get value(): string {
        return this.querySelector('input')?.value || '';
    }
    // #endregion

    // #region 4. Rendering
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
    // #endregion

    // #region 5. Events
    private bindEvents() {
        this.querySelector('input')?.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value.trim();
            this.onSearch?.(val);
        });
    }
    // #endregion
}

customElements.define('app-search', AppSearch);