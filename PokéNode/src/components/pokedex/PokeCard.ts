import type { Pokemon, ImageMode, PokemonLite } from '../../types/model';
import { MediaHandler } from '../../utils/MediaHandler';
import { I18n } from '../../services/I18n';

export class PokeCard extends HTMLElement {

    // #region CONFIG & ETAT
    // ============================================================================
    static get observedAttributes() {
        return ['mode'];
    }

    private _pokemon: Pokemon | PokemonLite | null = null;
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        if (this._pokemon) {
            this.render();
        }
    }

    attributeChangedCallback(name: string, prev: string, next: string) {
        if (name === 'mode' && prev !== next && this._pokemon) {
            this.render();
        }
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    set pokemon(data: Pokemon | PokemonLite) {
        this._pokemon = data;
        this.dataset.id = data.id.toString();

        if (this.isConnected) {
            this.render();
        }
    }

    get pokemon(): Pokemon | PokemonLite | null {
        return this._pokemon;
    }
    // #endregion

    // #region RENDER
    // ============================================================================
    private render() {
        if (!this._pokemon) return;

        const mode = (this.getAttribute('mode') as ImageMode) || 'artwork';
        const p = this._pokemon;
        const hasFullData = 'types' in p;
        const formattedId = p.id.toString().padStart(3, '0');
        const rot = (p.id % 6) - 3;

        let displayName: string;
        if (typeof p.name === 'string') {
            displayName = p.name.charAt(0).toUpperCase() + p.name.slice(1);
        } else {
            displayName = I18n.getName(p.name);
        }

        const imageUrl = MediaHandler.getCardImage(p as { id: number }, mode);
        const placeholder = MediaHandler.getPlaceholder(mode);

        const typesHtml = hasFullData
            ? (p as Pokemon).types
                .map(type => `<span class="card-type-badge type-${type}">${I18n.translateType(type)}</span>`)
                .join('')
            : '';

        this.innerHTML = /*html*/ `
            <div class="pokemon-card ${hasFullData ? '' : 'is-loading'}" 
                 style="--rotation: ${rot}deg;">
                 
                <div class="types-container">${typesHtml}</div>
                
                <div class="img-container">
                    <img id="card-img"
                         src="${imageUrl}" 
                         alt="${displayName}" 
                         loading="lazy" 
                         class="${mode === 'legacy' ? 'pixelated' : ''}">
                </div>
                
                <div class="id-badge-card">#${formattedId}</div>
                <h3>${displayName}</h3>
            </div>
        `;

        this.attachErrorHandling(placeholder);
    }

    private attachErrorHandling(placeholder: string) {
        const img = this.querySelector('#card-img') as HTMLImageElement;
        if (img) {
            img.onerror = () => {
                img.onerror = null; 
                img.src = placeholder;
            };
        }
    }
    // #endregion
}

customElements.define('poke-card', PokeCard);