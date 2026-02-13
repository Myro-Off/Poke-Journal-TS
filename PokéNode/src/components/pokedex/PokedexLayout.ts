import { I18n } from '../../services/I18n';
import { PokeCard } from './PokeCard';
import type { Pokemon, PokemonLite, ImageMode } from '../../types/model';

export class PokedexLayout {

    // #region INITIALISATION
    // ============================================================================
    static renderBaseLayout() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            ${this.buildCoverHTML()}
            ${this.buildHeaderHTML()}
            ${this.buildPaginationControlsHTML()}
            ${this.buildGridContainerHTML()}
            ${this.buildEmptyStateHTML()}
        `;
    }
    // #endregion

    // #region AFFICHAGE DE LA GRILLE
    // ============================================================================
    static renderGrid(pokemons: (Pokemon | PokemonLite)[], mode: ImageMode) {
        const container = document.getElementById('pokedex-list');
        if (!container) return;

        container.innerHTML = '';

        pokemons.forEach(pokemon => {
            const card = this.createCardElement(pokemon, mode);
            container.appendChild(card);
        });
    }

    private static createCardElement(pokemon: Pokemon | PokemonLite, mode: ImageMode): HTMLElement {
        const card = document.createElement('poke-card') as PokeCard;
        card.pokemon = pokemon;
        card.setAttribute('mode', mode);
        card.setAttribute('data-id', pokemon.id.toString());
        return card;
    }
    // #endregion

    // #region GESTION DE L'INTERFACE
    // ============================================================================
    static toggleEmptyState(isEmpty: boolean) {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = isEmpty ? 'block' : 'none';
        }
    }

    static updatePaginationUI(currentPage: number, totalPages: number, onPageChange: (page: number) => void) {
        const infoContainer = document.getElementById('page-info-top');
        const btnPrev = document.getElementById('btn-prev-top') as HTMLButtonElement;
        const btnNext = document.getElementById('btn-next-top') as HTMLButtonElement;

        if (infoContainer) {
            this.renderPaginationCounter(infoContainer, currentPage, totalPages);
            this.bindPaginationInput(infoContainer, totalPages, onPageChange);
        }

        if (btnPrev) btnPrev.disabled = currentPage <= 1;
        if (btnNext) btnNext.disabled = currentPage >= totalPages;
    }
    // #endregion

    // #region GÉNÉRATEURS HTML
    // ============================================================================
    private static buildCoverHTML(): string {
        return /*html*/ `
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
        `;
    }

    private static buildHeaderHTML(): string {
        return /*html*/ `
            <div id="app-header-container">
                <app-header id="app-header"></app-header>
            </div>
        `;
    }

    private static buildPaginationControlsHTML(): string {
        return /*html*/ `
            <div class="pagination-controls">
                <button id="btn-prev-top" class="page-btn">❮</button>
                <span id="page-info-top" style="align-self:center;"></span>
                <button id="btn-next-top" class="page-btn">❯</button>
            </div>
        `;
    }

    private static buildGridContainerHTML(): string {
        return /*html*/ `<div id="pokedex-list" class="grid"></div>`;
    }

    private static buildEmptyStateHTML(): string {
        return /*html*/ `
            <div id="empty-state" style="display:none; text-align:center; padding:50px; color:white; font-family:var(--font-hand), serif;">
                ${I18n.t('no_results')}
            </div>
        `;
    }

    private static renderPaginationCounter(container: HTMLElement, current: number, total: number) {
        container.innerHTML = /*html*/ `
            <div class="pagination-tape">
                <input type="number" class="page-input-ink" value="${current}" min="1" max="${total}">
                <span class="page-divider">/</span>
                <span class="page-max">${total}</span>
            </div>
        `;
    }

    private static bindPaginationInput(container: HTMLElement, totalPages: number, callback: (page: number) => void) {
        const input = container.querySelector('.page-input-ink') as HTMLInputElement;
        if (!input) return;

        const cleanInput = input.cloneNode(true) as HTMLInputElement;
        input.parentNode?.replaceChild(cleanInput, input);

        cleanInput.onchange = (e) => {
            const val = Number.parseInt((e.target as HTMLInputElement).value);
            if (val >= 1 && val <= totalPages) {
                callback(val);
            }
        };
    }
    // #endregion
}