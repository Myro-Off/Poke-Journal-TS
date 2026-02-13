import { TeamService } from '../../services/TeamService';
import { PaperNotification } from '../common/PaperNotification';
import { I18n } from '../../services/I18n';
import { TypeCalculator } from '../../utils/TypeCalculator';
import type { Team, TeamMember, ImageMode } from '../../types/model';
import { MiniPokedex } from './MiniPokedex';
import { BattlePrepModal } from './BattlePrepModal';
import './MiniPokedex';
import './BattlePrepModal';

export class TeamBuilderPage extends HTMLElement {

    // #region ÉTAT
    // ============================================================================
    private currentMode: ImageMode = 'artwork';
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        this.initializeModeFromHeader();
        this.renderLayout();
        this.refreshJournal();
        this.bindGlobalListeners();
    }

    private initializeModeFromHeader() {
        const header = document.querySelector('app-header');
        if (header) {
            this.currentMode = (header.getAttribute('mode') as ImageMode) || 'artwork';
        }
    }

    private bindGlobalListeners() {
        window.addEventListener('teams:updated', () => this.refreshJournal());

        window.addEventListener('settings:changed', (e: Event) => {
            const evt = e as CustomEvent<{ mode: ImageMode }>;
            this.currentMode = evt.detail.mode;
            this.updateStaticTexts();
            this.refreshJournal();
        });
    }
    // #endregion

    // #region RENDU PRINCIPAL
    // ============================================================================
    private renderLayout() {
        this.innerHTML = /*html*/ `
            <div class="journal-container">
                <header class="journal-header">
                    <h2 id="journal-title">...</h2>
                    <div class="ink-decoration"></div>
                    <button class="btn-ink" id="btn-create-team">
                        <span id="btn-create-text">...</span>
                    </button>
                </header>

                <div class="journal-grid" id="journal-grid"></div>

                <mini-pokedex></mini-pokedex>
                <battle-prep-modal></battle-prep-modal>
            </div>
        `;

        this.updateStaticTexts();
        this.bindHeaderActions();
    }

    private refreshJournal() {
        const grid = this.querySelector('#journal-grid');
        if (!grid) return;

        const teams = TeamService.getAllTeams();
        grid.innerHTML = teams.map(team => this.buildTeamPageHTML(team)).join('');

        this.updateStaticTexts();
        this.bindPageActions();
    }

    private updateStaticTexts() {
        const teams = TeamService.getAllTeams();
        const titleKey = teams.length > 1 ? 'team_title' : 'team_title_single';

        const title = this.querySelector('#journal-title');
        const btnText = this.querySelector('#btn-create-text');

        if (title) title.textContent = I18n.getText(titleKey);
        if (btnText) btnText.textContent = I18n.getText('new_team');
    }
    // #endregion

    // #region GÉNÉRATEURS HTML
    // ============================================================================
    private buildTeamPageHTML(team: Team): string {
        const threatsHTML = this.buildThreatsSection(team);
        const slotsHTML = team.members.map((member, index) => 
            this.buildMemberSlotHTML(member, team.id, index)
        ).join('');

        return /*html*/ `
            <div class="journal-page" data-id="${team.id}">
                <div class="paper-holes"></div>
                
                <div class="page-header">
                    <input type="text" class="handwritten-input" value="${team.name}" data-id="${team.id}" spellcheck="false">
                    <button class="btn-tear-page" data-id="${team.id}" title="${I18n.getText('tear_page')}">✕</button>
                </div>

                <div class="strategic-note">
                    <div class="note-label">⚠️ ${I18n.getText('weaknesses_label')}</div>
                    <div class="threat-list">
                        ${threatsHTML}
                    </div>
                </div>

                <div class="team-slots-grid">
                    ${slotsHTML}
                </div>
                
                <div class="page-footer">
                    <span class="page-number">N° ${team.id.substring(0, 4)}</span>
                </div>
            </div>
        `;
    }

    private buildThreatsSection(team: Team): string {
        const weaknesses = this.calculateTeamWeaknesses(team);
        
        if (weaknesses.length === 0) {
            return /*html*/ `<span class="no-threat-msg">${I18n.getText('no_weakness')}</span>`;
        }

        return weaknesses.map(({ type, count }) => {
            const severityClass = count >= 3 ? 'critical' : 'warning';
            return /*html*/ `
                <div class="threat-item">
                    <span class="type-badge type-${type}" style="font-size:0.8rem; padding: 3px 8px;">
                        ${I18n.translateType(type)}
                    </span>
                    <span class="threat-count ${severityClass}">
                        ${count}
                    </span>
                </div>
            `;
        }).join('');
    }

    private buildMemberSlotHTML(member: TeamMember | null, teamId: string, index: number): string {
        if (!member) {
            return /*html*/ `
                <div class="sketch-slot empty clickable" data-team="${teamId}" data-index="${index}">
                    <div class="sketch-placeholder">?</div>
                    <span class="caption">${I18n.getText('add_pokemon')}</span>
                </div>
            `;
        }

        const imgUrl = this.currentMode === 'legacy'
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.id}.png`
            : (member.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${member.id}.png`);

        const pixelClass = this.currentMode === 'legacy' ? 'pixelated' : '';
        const name = I18n.getName(member.nameEn ? { fr: member.name, en: member.nameEn } : { fr: member.name, en: member.name });

        return /*html*/ `
            <div class="sketch-slot filled inspect-trigger" data-team="${teamId}" data-index="${index}">
                <img src="${imgUrl}" class="sketch-img ${pixelClass}" loading="lazy" alt="${name}">
                <span class="sketch-name">${name}</span>
                <div class="sketch-actions">
                    <button class="btn-icon remove-btn" data-team="${teamId}" data-index="${index}">✕</button>
                </div>
            </div>
        `;
    }
    // #endregion

    // #region LOGIQUE ET CALCULS
    // ============================================================================
    private calculateTeamWeaknesses(team: Team): { type: string, count: number }[] {
        const counts: Record<string, number> = {};

        team.members.forEach(member => {
            if (!member) return;
            const result = TypeCalculator.getWeaknesses(member.types);
            result.weak.forEach(w => {
                counts[w.type] = (counts[w.type] || 0) + 1;
            });
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => ({ type, count }));
    }
    // #endregion

    // #region ÉVÉNEMENTS
    // ============================================================================
    private bindHeaderActions() {
        this.querySelector('#btn-create-team')?.addEventListener('click', () => {
            TeamService.createTeam(`???`);
        });
    }

    private bindPageActions() {
        this.bindRenamingActions();
        this.bindDeletionActions();
        this.bindSlotActions();
    }

    private bindRenamingActions() {
        this.querySelectorAll('.handwritten-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.dataset.id) {
                    TeamService.renameTeam(target.dataset.id, target.value);
                }
            });
        });
    }

    private bindDeletionActions() {
        this.querySelectorAll('.btn-tear-page').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).dataset.id;
                if (!id) return;

                const confirmAction = () => TeamService.deleteTeam(id);

                if (customElements.get('paper-notification')) {
                    PaperNotification.show(I18n.getText('tear_confirm'), 'confirm', confirmAction);
                } else {
                    if (confirm(I18n.getText('tear_confirm'))) confirmAction();
                }
            });
        });
    }

    private bindSlotActions() {
        // Clear Slot
        this.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const { team, index } = (e.currentTarget as HTMLElement).dataset;
                if (team && index) {
                    TeamService.clearSlot(team, Number(index));
                }
            });
        });

        // Add Pokemon (Open MiniDex)
        this.querySelectorAll('.sketch-slot.empty').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const { team, index } = (e.currentTarget as HTMLElement).dataset;
                const miniDex = this.querySelector('mini-pokedex') as MiniPokedex;
                
                if (miniDex && team && index) {
                    miniDex.open(team, Number(index));
                }
            });
        });

        // Inspect Pokemon (Open Modal)
        this.querySelectorAll('.inspect-trigger').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const { team: teamId, index } = (e.currentTarget as HTMLElement).dataset;
                if (!teamId || !index) return;

                const team = TeamService.getTeamById(teamId);
                const member = team?.members[Number(index)];

                if (member) {
                    const modal = this.querySelector('battle-prep-modal') as BattlePrepModal;
                    if (modal) {
                        modal.setMode(this.currentMode);
                        modal.open(teamId, Number(index), member);
                    }
                }
            });
        });
    }
    // #endregion
}

customElements.define('team-builder-page', TeamBuilderPage);