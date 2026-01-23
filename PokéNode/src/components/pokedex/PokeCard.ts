import type { Pokemon, ImageMode, PokemonLite } from '../../types/model';
import { MediaHandler } from '../../utils/MediaHandler';
import { I18n } from '../../services/I18n';

export class PokeCard extends HTMLElement {

    /* ==========================================================================
       1. CONFIGURATION
       ========================================================================== */

    // @ts-ignore
    static get observedAttributes() {
        return ['mode'];
    }

    private _pokemon: Pokemon | PokemonLite | null = null;

    /* ==========================================================================
       2. CYCLE DE VIE
       ========================================================================== */

    // @ts-ignore
    connectedCallback() {
        // Optimisation : On ne dessine que si on a des données
        if (this._pokemon) {
            this.render();
        }
    }

    // @ts-ignore
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        // Si le mode change (HD <-> Pixel), on redessine l'image
        if (name === 'mode' && oldValue !== newValue && this._pokemon) {
            this.render();
        }
    }

    /* ==========================================================================
       3. PROPRIÉTÉS (API JS)
       ========================================================================== */

    set pokemon(data: Pokemon | PokemonLite) {
        this._pokemon = data;
        this.dataset.id = data.id.toString();

        // Si le composant est déjà dans la page, on affiche
        if (this.isConnected) {
            this.render();
        }
    }

    get pokemon(): Pokemon | PokemonLite | null {
        return this._pokemon;
    }

    /* ==========================================================================
       4. RENDU
       ========================================================================== */

    private render() {
        if (!this._pokemon) return;

        const mode = (this.getAttribute('mode') as ImageMode) || 'artwork';
        const p = this._pokemon;

        // Détection : Est-ce un Pokémon complet ou juste les données légères ?
        const hasFullData = 'types' in p;

        // Formatage ID (#001)
        const formattedId = p.id.toString().padStart(3, '0');

        // Petite rotation aléatoire basée sur l'ID (pour le style)
        const rot = (p.id % 6) - 3;

        // Gestion du Nom (soit string, soit objet traduit)
        let displayName: string;
        if (typeof p.name === 'string') {
            displayName = p.name.charAt(0).toUpperCase() + p.name.slice(1);
        } else {
            displayName = I18n.getName(p.name);
        }

        // Récupération de l'image
        const imageUrl = MediaHandler.getCardImage(p as Pokemon, mode);
        const placeholder = MediaHandler.getPlaceholder(mode);

        // Génération des badges types (seulement si on a les données complètes)
        const typesHtml = hasFullData
            ? (p as Pokemon).types
                .map(type => `<span class="card-type-badge type-${type}">${I18n.translateType(type)}</span>`)
                .join('')
            : '';

        // Injection HTML
        this.innerHTML = `
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

        // Gestion d'erreur d'image (Fallback)
        const img = this.querySelector('#card-img') as HTMLImageElement;
        if (img) {
            img.onerror = () => {
                img.onerror = null; // Évite la boucle infinie en cas d'erreur du placeholder
                img.src = placeholder;
            };
        }
    }
}

customElements.define('poke-card', PokeCard);
