import type { Pokemon, ImageMode, PokemonLite } from '../../types/model';
import { MediaHandler } from '../../utils/MediaHandler';
import { I18n } from '../../services/I18n';

export class PokeCard extends HTMLElement {

    // #region CONFIGURATION & ÉTAT
    // ============================================================================
    static get observedAttributes() {
        return ['mode'];
    }

    private _pokemon: Pokemon | PokemonLite | null = null;
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        this.renderLayout();
    }

    attributeChangedCallback(name: string, prev: string, next: string) {
        if (name === 'mode' && prev !== next) {
            this.renderLayout();
        }
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    set pokemon(data: Pokemon | PokemonLite | null) {
        this._pokemon = data;
        
        if (data) {
            this.dataset.id = data.id.toString();
        }
        
        if (this.isConnected) {
            this.renderLayout();
        }
    }

    get pokemon(): Pokemon | PokemonLite | null {
        return this._pokemon;
    }
    // #endregion

    // #region RENDU
    // ============================================================================
    private renderLayout() {
        if (!this._pokemon) return;

        const mode = (this.getAttribute('mode') as ImageMode) || 'artwork';
        this.innerHTML = this.buildCardHTML(this._pokemon, mode);
        
        this.bindImageErrorHandling(mode);
    }

    private buildCardHTML(p: Pokemon | PokemonLite, mode: ImageMode): string {
        const displayName = this.getDisplayName(p);
        const formattedId = this.formatId(p.id);
        const rotation = this.calculateRotation(p.id);
        const imageUrl = MediaHandler.getCardImage(p, mode);
        const pixelClass = mode === 'legacy' ? 'pixelated' : '';
        
        const typesHtml = this.buildTypesHTML(p);
        const loadingClass = typesHtml ? '' : 'is-loading';

        return /*html*/ `
            <div class="pokemon-card ${loadingClass}" style="--rotation: ${rotation}deg;">
                 
                <div class="types-container">
                    ${typesHtml}
                </div>
                
                <div class="img-container">
                    <img id="card-img"
                         src="${imageUrl}" 
                         alt="${displayName}" 
                         loading="lazy" 
                         class="${pixelClass}">
                </div>
                
                <div class="id-badge-card">#${formattedId}</div>
                <h3>${displayName}</h3>
            </div>
        `;
    }

    private buildTypesHTML(p: Pokemon | PokemonLite): string {
        if ('types' in p && Array.isArray((p as Pokemon).types)) {
            return (p as Pokemon).types
                .map(type => /*html*/ `<span class="card-type-badge type-${type}">${I18n.translateType(type)}</span>`)
                .join('');
        }
        return '';
    }
    // #endregion

    // #region LOGIQUE D'AFFICHAGE & HELPERS
    // ============================================================================
    private getDisplayName(p: Pokemon | PokemonLite): string {
        if (typeof p.name === 'string') {
            return p.name.charAt(0).toUpperCase() + p.name.slice(1);
        }
        return I18n.getName(p.name);
    }

    private formatId(id: number): string {
        return id.toString().padStart(3, '0');
    }

    private calculateRotation(id: number): number {
        return (id % 6) - 3;
    }

    private bindImageErrorHandling(mode: ImageMode) {
        const img = this.querySelector('#card-img') as HTMLImageElement;
        if (img) {
            img.onerror = () => {
                img.onerror = null; 
                img.src = MediaHandler.getPlaceholder(mode);
            };
        }
    }
    // #endregion
}

customElements.define('poke-card', PokeCard);