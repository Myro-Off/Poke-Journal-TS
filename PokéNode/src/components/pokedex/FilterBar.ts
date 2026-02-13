import { I18n } from '../../services/I18n';
import type { PokemonType } from '../../types/model';

export class AppFilter extends HTMLElement {

    // #region CONFIGURATION & ÉTAT
    // ============================================================================
    static get observedAttributes() { 
        return ['type', 'gen', 'lang']; 
    }

    public onFilter?: (type: PokemonType | 'all', gen: string | 'all') => void;

    private availableTypes: string[] = [];
    private availableGens: string[] = [];
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        if (!this.hasChildNodes()) {
            this.renderLayout();
            this.bindEvents();
        }
        this.syncSelectsWithAttributes();
    }

    attributeChangedCallback(name: string, prev: string, next: string) {
        if (prev === next) return;

        if (name === 'lang') {
            this.renderLayout();
            this.bindEvents();
        } else {
            this.syncSelectsWithAttributes();
        }
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    set typesList(list: string[]) {
        this.availableTypes = list;
        this.renderLayout();
        this.bindEvents();
    }

    set gensList(list: string[]) {
        this.availableGens = list;
        this.renderLayout();
        this.bindEvents();
    }
    // #endregion

    // #region RENDU
    // ============================================================================
    private renderLayout() {
        const currentType = this.getAttribute('type') || 'all';
        const currentGen = this.getAttribute('gen') || 'all';

        this.innerHTML = /*html*/ `
            <div class="filter-group" style="display:flex; gap:10px;">
                <select id="type-filter" class="filter-select">
                    <option value="all" ${currentType === 'all' ? 'selected' : ''}>${I18n.t('filter_type')}</option>
                    ${this.buildTypeOptionsHTML(currentType)}
                </select>
                
                <select id="gen-filter" class="filter-select">
                    <option value="all" ${currentGen === 'all' ? 'selected' : ''}>${I18n.t('all_gen')}</option>
                    ${this.buildGenOptionsHTML(currentGen)}
                </select>
            </div>
        `;
    }

    private buildTypeOptionsHTML(currentType: string): string {
        return this.availableTypes.map(t => `
            <option value="${t}" ${currentType === t ? 'selected' : ''}>
                ${I18n.translateType(t)}
            </option>
        `).join('');
    }

    private buildGenOptionsHTML(currentGen: string): string {
        return this.availableGens.map(g => `
            <option value="${g}" ${currentGen === g ? 'selected' : ''}>
                Gen ${g}
            </option>
        `).join('');
    }

    private syncSelectsWithAttributes() {
        const typeSelect = this.querySelector('#type-filter') as HTMLSelectElement;
        const genSelect = this.querySelector('#gen-filter') as HTMLSelectElement;

        if (typeSelect) typeSelect.value = this.getAttribute('type') || 'all';
        if (genSelect) genSelect.value = this.getAttribute('gen') || 'all';
    }
    // #endregion

    // #region INTERACTIONS
    // ============================================================================
    private bindEvents() {
        const typeSelect = this.querySelector('#type-filter') as HTMLSelectElement;
        const genSelect = this.querySelector('#gen-filter') as HTMLSelectElement;

        const handleChange = () => {
            const typeVal = typeSelect.value;
            const genVal = genSelect.value;

            this.setAttribute('type', typeVal);
            this.setAttribute('gen', genVal);

            if (this.onFilter) {
                this.onFilter(typeVal as PokemonType | 'all', genVal);
            }
        };

        typeSelect?.addEventListener('change', handleChange);
        genSelect?.addEventListener('change', handleChange);
    }
    // #endregion
}

customElements.define('app-filter', AppFilter);