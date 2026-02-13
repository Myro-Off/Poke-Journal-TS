import { I18n } from '../../services/I18n';
import { PokemonAPI } from '../../core/api';

export class MoveSelector extends HTMLElement {

    // #region PROPRIÉTÉS & CALLBACKS
    // ============================================================================
    public onSelect: ((moveName: string) => void) | null = null;
    public onClose: (() => void) | null = null;

    private availableMoveIds: string[] = [];
    private learnedMoveIds: string[] = [];
    
    private handleKeydownBound = this.handleKeydown.bind(this);
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        this.className = "move-selector-overlay";
        this.renderLayout();
        this.bindLayoutEvents();
        this.bindGlobalEvents();
        this.focusSearchInput();
    }

    disconnectedCallback() {
        this.unbindGlobalEvents();
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    public open(availableMoves: string[], currentMoves: string[]) {
        this.availableMoveIds = availableMoves.sort();
        this.learnedMoveIds = currentMoves;
        this.refreshMoveList();
    }
    // #endregion

    // #region GESTION INTERNE
    // ============================================================================
    private close() {
        if (this.onClose) this.onClose();
        this.remove();
    }

    private handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.close();
        }
    }

    private focusSearchInput() {
        setTimeout(() => this.querySelector('input')?.focus(), 50);
    }
    // #endregion

    // #region RENDU & STRUCTURE
    // ============================================================================
    private renderLayout() {
        this.innerHTML = /*html*/ `
            <div class="move-selector-box">
                <div class="selector-header">
                    <h3>${I18n.t('chose_move')}</h3>
                    <button id="close-select" class="btn-close-sketch" title="Fermer">X</button>
                </div>
                <input type="text" id="move-filter" placeholder="${I18n.t('move_placeholder')}..." autocomplete="off">
                <div class="move-list-container" id="move-list"></div>
            </div>
        `;
    }

    private refreshMoveList(filterText: string = "") {
        const container = this.querySelector('#move-list');
        if (!container) return;

        const matches = this.filterMoves(filterText);

        if (matches.length === 0) {
            container.innerHTML = this.buildEmptyStateHTML();
            return;
        }

        container.innerHTML = matches.map(id => this.buildMoveItemHTML(id)).join('');
        this.bindListEvents(container);
    }

    private buildMoveItemHTML(technicalName: string): string {
        const isLearned = this.learnedMoveIds.includes(technicalName);
        const displayName = this.getDisplayName(technicalName);

        return /*html*/ `
            <div class="move-item ${isLearned ? 'learned' : ''}" data-technical="${technicalName}">
                ${displayName}
            </div>
        `;
    }

    private buildEmptyStateHTML(): string {
        return /*html*/ `<div style="text-align:center; padding:20px; color:#999; font-family:var(--font-hand);">Aucun résultat.</div>`;
    }
    // #endregion

    // #region LOGIQUE MÉTIER
    // ============================================================================
    private filterMoves(searchText: string): string[] {
        const search = searchText.toLowerCase().trim();
        
        return this.availableMoveIds.filter(techName => {
            const displayName = this.getDisplayName(techName);
            return displayName.toLowerCase().includes(search);
        });
    }

    private getDisplayName(technicalName: string): string {
        const names = PokemonAPI.getMoveName(technicalName);
        return I18n.currentLang === 'fr' ? names.fr : names.en;
    }
    // #endregion

    // #region ÉVÉNEMENTS
    // ============================================================================
    private bindGlobalEvents() {
        document.addEventListener('keydown', this.handleKeydownBound);
    }

    private unbindGlobalEvents() {
        document.removeEventListener('keydown', this.handleKeydownBound);
    }

    private bindLayoutEvents() {
        this.addEventListener('click', (e) => {
            if (e.target === this) this.close();
        });

        this.querySelector('.move-selector-box')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.querySelector('#close-select')?.addEventListener('click', () => this.close());

        this.querySelector('#move-filter')?.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value;
            this.refreshMoveList(val);
        });
    }

    private bindListEvents(container: Element) {
        container.querySelectorAll('.move-item:not(.learned)').forEach(item => {
            item.addEventListener('click', () => {
                const techName = (item as HTMLElement).dataset.technical!;
                if (this.onSelect) this.onSelect(techName);
                this.close();
            });
        });
    }
    // #endregion
}

customElements.define('move-selector', MoveSelector);