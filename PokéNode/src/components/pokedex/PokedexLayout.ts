import { I18n } from '../../services/I18n';
import { PokeCard } from './PokeCard';
import type { Pokemon, PokemonLite, ImageMode } from '../../types/model';

export class PokedexLayout {

    // #region STRUCTURE GLOBALE
    // ============================================================================
    static renderBaseLayout() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = /*html*/ `
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
    // #endregion

    // #region GRILLE DE POKEMON
    // ============================================================================
    static renderGrid(pokemons: (Pokemon | PokemonLite)[], mode: ImageMode) {
        const list = document.getElementById('pokedex-list');
        if (!list) return;

        list.innerHTML = '';

        pokemons.forEach(p => {
            const card = document.createElement('poke-card') as PokeCard;
            
            card.pokemon = p;
            card.setAttribute('mode', mode);
            card.setAttribute('data-id', p.id.toString());

            list.appendChild(card);
        });
    }
    // #endregion

    // #region UTILITAIRES UI (Pagination / Empty State)
    // ============================================================================
    static toggleEmptyState(isEmpty: boolean) {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) emptyState.style.display = isEmpty ? 'block' : 'none';
    }

    static updatePaginationUI(currentPage: number, totalPages: number, onPageChange: (page: number) => void) {
        const infoTop = document.getElementById('page-info-top');
        const btnPrevTop = document.getElementById('btn-prev-top') as HTMLButtonElement;
        const btnNextTop = document.getElementById('btn-next-top') as HTMLButtonElement;

        if (infoTop) {
            infoTop.innerHTML = /*html*/ `
                <div class="pagination-tape">
                    <input type="number" class="page-input-ink" value="${currentPage}" min="1" max="${totalPages}">
                    <span class="page-divider">/</span>
                    <span class="page-max">${totalPages}</span>
                </div>
            `;

            const input = infoTop.querySelector('.page-input-ink') as HTMLInputElement;

            // Clone pour nettoyer les anciens event listeners (anti Memory Leak)
            const newClone = input.cloneNode(true) as HTMLInputElement;
            input.parentNode?.replaceChild(newClone, input);

            newClone.onchange = (e) => {
                let val = Number.parseInt((e.target as HTMLInputElement).value);
                if (val >= 1 && val <= totalPages) onPageChange(val);
            };
        }

        if (btnPrevTop) btnPrevTop.disabled = currentPage <= 1;
        if (btnNextTop) btnNextTop.disabled = currentPage >= totalPages;
    }
    // #endregion
}