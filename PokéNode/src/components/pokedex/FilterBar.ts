import { I18n } from '../../services/I18n';
import type { PokemonType } from '../../types/model';

export class AppFilter extends HTMLElement {

    /* ==========================================================================
       1. CONFIGURATION
       ========================================================================== */

    // @ts-ignore
    static get observedAttributes() { return ['type', 'gen', 'lang']; }

    public onFilter?: (type: PokemonType | 'all', gen: string | 'all') => void;

    private _types: string[] = [];
    private _gens: string[] = [];

    /* ==========================================================================
       2. CYCLE DE VIE
       ========================================================================== */

    // @ts-ignore
    connectedCallback() {
        if (!this.innerHTML.trim()) {
            this.render();
            this.attachEvents();
        }
        this.updateSelectsFromAttributes();
    }

    // @ts-ignore
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;

        // Si la LANGUE change, on doit re-rendre tout le HTML pour traduire les options
        if (name === 'lang') {
            this.render();
            this.attachEvents();
            this.updateSelectsFromAttributes();
        }
        // Si c'est juste le TYPE ou GEN qui change, on met juste à jour la valeur du select
        else {
            this.updateSelectsFromAttributes();
        }
    }

    /* ==========================================================================
       3. PROPRIÉTÉS
       ========================================================================== */

    set typesList(list: string[]) {
        this._types = list;
        this.render();
        this.attachEvents();
    }

    set gensList(list: string[]) {
        this._gens = list;
        this.render();
        this.attachEvents();
    }

    /* ==========================================================================
       4. RENDU & LOGIQUE
       ========================================================================== */

    private updateSelectsFromAttributes() {
        const typeSelect = this.querySelector('#type-filter') as HTMLSelectElement;
        const genSelect = this.querySelector('#gen-filter') as HTMLSelectElement;

        if (!typeSelect || !genSelect) return;

        typeSelect.value = this.getAttribute('type') || 'all';
        genSelect.value = this.getAttribute('gen') || 'all';
    }

    private render() {
        const currentType = this.getAttribute('type') || 'all';
        const currentGen = this.getAttribute('gen') || 'all';

        this.innerHTML = `
            <div class="filter-group" style="display:flex; gap:10px;">
                <select id="type-filter" class="filter-select">
                    <option value="all" ${currentType === 'all' ? 'selected' : ''}>${I18n.t('filter_type')}</option>
                    ${this._types.map(t => `
                        <option value="${t}" ${currentType === t ? 'selected' : ''}>
                            ${I18n.translateType(t)}
                        </option>`).join('')}
                </select>
                
                <select id="gen-filter" class="filter-select">
                    <option value="all" ${currentGen === 'all' ? 'selected' : ''}>${I18n.t('all_gen')}</option>
                    ${this._gens.map(g => `
                        <option value="${g}" ${currentGen === g ? 'selected' : ''}>
                            Gen ${g}
                        </option>`).join('')}
                </select>
            </div>
        `;
    }

    private attachEvents() {
        const typeSelect = this.querySelector('#type-filter');
        const genSelect = this.querySelector('#gen-filter');

        const handleChange = () => {
            const typeVal = (typeSelect as HTMLSelectElement).value;
            const genVal = (genSelect as HTMLSelectElement).value;

            this.setAttribute('type', typeVal);
            this.setAttribute('gen', genVal);

            if (this.onFilter) {
                this.onFilter(typeVal as PokemonType | 'all', genVal);
            }
        };

        typeSelect?.addEventListener('change', handleChange);
        genSelect?.addEventListener('change', handleChange);
    }
}

customElements.define('app-filter', AppFilter);
