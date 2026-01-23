import { I18n } from '../../services/I18n';
import { PokeCard } from './PokeCard';
import type { Pokemon, PokemonLite, ImageMode } from '../../types/model';

export class PokedexLayout {

    /* ==========================================================================
       1. STRUCTURE GLOBALE
       ========================================================================== */

    /**
     * Génère la structure HTML de base de la page (Header, Pagination, Grille vide)
     */
    static renderBaseLayout() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            <div id="opening-cover">
                <div class="cover-half cover-left">
                    <div class="cover-content">
                        <div class="cover-title">POKÉ</div>
                        <div class="cover-badge">2026</div>
                    </div>
                </div>
                <div class="cover-half cover-right">
                    <div class="cover-content">
                        <div class="cover-title">JOURNAL</div>
                        <div class="cover-logo"></div>
                    </div>
                </div>
            </div>
            
            <div id="app-header-container">
                <app-header id="app-header"></app-header>
            </div>
            
            <div class="pagination-controls">
                <button id="btn-prev-top" class="page-btn">❮</button>
                <span id="page-info-top" style="align-self:center;"></span>
                <button id="btn-next-top" class="page-btn">❯</button>
            </div>
            
            <div id="pokedex-list" class="grid"></div>
            
            <div id="empty-state" style="display:none; text-align:center; padding:50px; color:white; font-family:var(--font-hand), serif;">
                ${I18n.t('no_results')}
            </div>
        `;
    }

    /* ==========================================================================
       2. GESTION DE LA GRILLE
       ========================================================================== */

    /**
     * Met à jour la grille de cartes Pokémon avec les Web Components <poke-card>
     */
    static renderGrid(pokemons: (Pokemon | PokemonLite)[], mode: ImageMode) {
        const list = document.getElementById('pokedex-list');
        if (!list) return;

        // 1. Nettoyage de la grille actuelle
        list.innerHTML = '';

        // 2. Génération des nouvelles cartes
        pokemons.forEach(p => {
            // Création de l'élément personnalisé
            const card = document.createElement('poke-card') as PokeCard;

            // A. Passage de la donnée complexe (Objet JS) via propriété
            card.pokemon = p;

            // B. Passage des attributs HTML (pour le CSS et les Sélecteurs)
            card.setAttribute('mode', mode);

            card.setAttribute('data-id', p.id.toString());

            // C. Ajout à la grille
            list.appendChild(card);
        });
    }

    /* ==========================================================================
       3. UTILITAIRES D'INTERFACE
       ========================================================================== */

    /**
     * Affiche ou masque le message "Aucun résultat"
     */
    static toggleEmptyState(isEmpty: boolean) {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) emptyState.style.display = isEmpty ? 'block' : 'none';
    }

    /**
     * Met à jour l'affichage des boutons de pagination et du numéro de page
     */
    static updatePaginationUI(currentPage: number, totalPages: number, onPageChange: (page: number) => void) {
        const infoTop = document.getElementById('page-info-top');
        const btnPrevTop = document.getElementById('btn-prev-top') as HTMLButtonElement;
        const btnNextTop = document.getElementById('btn-next-top') as HTMLButtonElement;

        // Mise à jour de l'indicateur "Page X / Y"
        if (infoTop) {
            infoTop.innerHTML = `
                <div class="pagination-tape">
                    <input type="number" class="page-input-ink" value="${currentPage}" min="1" max="${totalPages}">
                    <span class="page-divider">/</span>
                    <span class="page-max">${totalPages}</span>
                </div>
            `;

            // Gestion de l'input manuel de page
            const input = infoTop.querySelector('.page-input-ink') as HTMLInputElement;

            // Astuce : Cloner pour supprimer les anciens EventListeners accumulés
            const newClone = input.cloneNode(true) as HTMLInputElement;
            input.parentNode?.replaceChild(newClone, input);

            newClone.onchange = (e) => {
                let val = Number.parseInt((e.target as HTMLInputElement).value);
                if (val >= 1 && val <= totalPages) onPageChange(val);
            };
        }

        // État des boutons (Désactivés si début/fin)
        if (btnPrevTop) btnPrevTop.disabled = currentPage <= 1;
        if (btnNextTop) btnNextTop.disabled = currentPage >= totalPages;
    }
}
