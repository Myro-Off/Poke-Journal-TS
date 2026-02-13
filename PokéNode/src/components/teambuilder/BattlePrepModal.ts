import { PokemonAPI } from '../../core/api';
import type { TeamMember, MoveLite, Pokemon, ImageMode, Language } from '../../types/model';
import { TeamService } from '../../services/TeamService';
import { TypeCalculator } from '../../utils/TypeCalculator';
import { MediaHandler } from '../../utils/MediaHandler';
import { I18n } from '../../services/I18n';
import { MoveSelector } from './MoveSelector';

export class BattlePrepModal extends HTMLElement {

    // #region CONFIGURATION & ÉTAT
    // ============================================================================
    private teamId: string = "";
    private slotIndex: number = -1;
    private member: TeamMember | null = null;
    private fullPokemonDetails: Pokemon | null = null;
    
    private currentMode: ImageMode = 'artwork';

    private readonly ICONS = {
        physical: `<svg viewBox="0 0 100 60" width="36" height="22"><path d="M10,30 L25,15 L40,25 L50,5 L60,25 L75,15 L90,30 L75,45 L60,35 L50,55 L40,35 L25,45 Z" fill="#f08030" stroke="#a04000" stroke-width="2"/><path d="M25,30 L40,20 L50,10 L60,20 L75,30 L60,40 L50,50 L40,40 Z" fill="#f8d030" opacity="0.8"/></svg>`,
        special: `<svg viewBox="0 0 100 60" width="36" height="22"><ellipse cx="50" cy="30" rx="40" ry="20" fill="#6890f0" stroke="#fff" stroke-width="2"/><ellipse cx="50" cy="30" rx="25" ry="12" fill="#ffffff" opacity="0.4"/><ellipse cx="50" cy="30" rx="10" ry="5" fill="#ffffff" opacity="0.6"/></svg>`,
        status: `<svg viewBox="0 0 100 60" width="36" height="22"><circle cx="50" cy="30" r="20" fill="#9c9c9c" stroke="#555" stroke-width="2"/><path d="M50,10 A20,20 0 0,1 50,50 A10,10 0 0,1 50,30 A10,10 0 0,0 50,10" fill="#fff" opacity="0.5"/><circle cx="50" cy="40" r="3" fill="#fff"/><circle cx="50" cy="20" r="3" fill="#555"/></svg>`
    };
    
    private handleKeydownBound = this.handleKeydown.bind(this);
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        this.initializeOverlay();
        if (!this.querySelector('.modal-content')) {
            this.renderLayout();
            this.bindStaticEvents();
        }
        this.bindGlobalSettingsListener();
    }

    private initializeOverlay() {
        this.style.display = 'none';
        this.className = "battle-modal-overlay"; 
        this.addEventListener('click', (e) => { 
            if (e.target === this) this.close(); 
        });
    }

    private bindGlobalSettingsListener() {
        globalThis.addEventListener('settings:changed', (e: Event) => {
            const evt = e as CustomEvent<{ mode: ImageMode, lang: Language }>;
            
            this.currentMode = evt.detail.mode;
            I18n.currentLang = evt.detail.lang;
            
            this.syncCheckboxes(evt.detail.lang, evt.detail.mode);

            if (this.isVisible()) {
                this.renderContent(); 
            }
        });
    }

    private isVisible(): boolean {
        return this.style.display === 'flex';
    }
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    public setMode(mode: ImageMode) { 
        this.currentMode = mode; 
    }

    public async open(teamId: string, slotIndex: number, member: TeamMember) {
        this.teamId = teamId;
        this.slotIndex = slotIndex;
        this.member = member;

        this.ensureMovesArrayInitialized();
        this.showModal();
        this.syncModeWithHeader();
        this.syncCheckboxes(I18n.currentLang, this.currentMode);

        // Loader temporaire dans les colonnes
        this.setLoadingState();
        
        try {
            this.fullPokemonDetails = await PokemonAPI.getPokemonDetails(member.id);
            await this.refreshMemberMoves();
            this.renderContent();
        } catch (e) {
            console.error(e);
            this.setErrorState();
        }
    }

    public close() {
        this.style.display = 'none';
        document.body.style.overflow = '';
        globalThis.removeEventListener('keydown', this.handleKeydownBound);
    }

    private showModal() {
        this.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        globalThis.addEventListener('keydown', this.handleKeydownBound);
    }

    private ensureMovesArrayInitialized() {
        if (this.member && !this.member.selectedMoves) {
            this.member.selectedMoves = [null, null, null, null];
        }
    }

    private syncModeWithHeader() {
        const header = document.querySelector('app-header');
        if (header) {
            this.currentMode = (header.getAttribute('mode') as ImageMode) || 'artwork';
        }
    }
    // #endregion

    // #region LOGIQUE DES DONNÉES
    // ============================================================================
    private async refreshMemberMoves() {
        if (!this.member) return;
        
        const updatePromises = this.member.selectedMoves.map(async (move, index) => {
            if (move && move.url && (!move.category || !move.description)) {
                const detailedMove = await PokemonAPI.getMoveDetails(move.url);
                this.updateMoveInStorage(index, detailedMove);
            }
        });
        
        await Promise.all(updatePromises);
    }

    private updateMoveInStorage(index: number, move: MoveLite | null) {
        const team = TeamService.getTeamById(this.teamId);
        if (!team || !team.members[this.slotIndex]) return;

        const currentMember = team.members[this.slotIndex]!;
        const updatedMoves = [...currentMember.selectedMoves] as [MoveLite | null, MoveLite | null, MoveLite | null, MoveLite | null];
        updatedMoves[index] = move;

        TeamService.updateMember(this.teamId, this.slotIndex, {
            ...currentMember,
            selectedMoves: updatedMoves
        });

        this.member = TeamService.getTeamById(this.teamId)!.members[this.slotIndex];
    }

    private updateMoveAndRender(index: number, move: MoveLite | null) {
        this.updateMoveInStorage(index, move);
        this.renderContent();
    }
    // #endregion

    // #region NAVIGATION & PARAMÈTRES
    // ============================================================================
    private handleKeydown(e: KeyboardEvent) {
        if (this.querySelector('move-selector')) return;
        
        switch(e.key) {
            case 'Escape': this.close(); break;
            case 'ArrowLeft': this.navigateCarousel(-1); break;
            case 'ArrowRight': this.navigateCarousel(1); break;
        }
    }

    private navigateCarousel(direction: number) {
        const team = TeamService.getTeamById(this.teamId);
        if (!team) return;

        let newIndex = this.slotIndex;
        let found = false;
        let attempts = 0;

        while (!found && attempts < 6) {
            newIndex += direction;
            if (newIndex < 0) newIndex = 5;
            if (newIndex > 5) newIndex = 0;
            
            if (team.members[newIndex] !== null) found = true;
            attempts++;
        }

        if (found && newIndex !== this.slotIndex) {
            this.open(this.teamId, newIndex, team.members[newIndex]!);
        }
    }

    private syncCheckboxes(lang: Language, mode: ImageMode) {
        const langIn = this.querySelector('#battle-toggle-lang') as HTMLInputElement;
        const modeIn = this.querySelector('#battle-toggle-mode') as HTMLInputElement;
        
        if (langIn) langIn.checked = (lang === 'en');
        if (modeIn) modeIn.checked = (mode === 'legacy');
    }
    // #endregion

    // #region RENDU STRUCTURE (LAYOUT)
    // ============================================================================
    private renderLayout() {
        this.innerHTML = /*html*/ `
            <div class="modal-content" style="width: 950px; height: 85vh; display:flex; padding:0; overflow:hidden; border-radius: 4px; position: relative;">
                
                ${this.buildSettingsHTML()}
                
                <button id="close-btn" class="close-btn-big"><span>×</span></button>

                <div id="battle-col-left" class="modal-col-left" style="width: 340px; flex-shrink:0; background: var(--paper-texture); padding: 30px; border-right: 1px solid #ccc; overflow-y:auto; display:flex; flex-direction:column; align-items:center;">
                    </div>

                <div id="battle-col-right" class="modal-col-right" style="flex:1; background: #fdfdfd; padding: 30px; overflow-y:auto;">
                    </div>

                <button class="modal-nav-btn prev" id="nav-prev" style="left:0;">❮</button>
                <button class="modal-nav-btn next" id="nav-next" style="right:0;">❯</button>
            </div>
        `;
    }

    private buildSettingsHTML() {
        return /*html*/ `
            <div class="modal-settings-wrapper" style="position:absolute; top:20px; right:80px; z-index:100; display:flex; gap:10px;">
                <div class="switch-container">
                    <label class="poke-switch">
                        <input type="checkbox" id="battle-toggle-lang">
                        <span class="poke-slider"></span>
                        <span class="switch-label">FR</span>
                        <span class="switch-label">EN</span>
                    </label>
                </div>
                <div class="switch-container">
                    <label class="poke-switch">
                        <input type="checkbox" id="battle-toggle-mode">
                        <span class="poke-slider"></span>
                        <span class="switch-label">HD</span>
                        <span class="switch-label">Pix</span>
                    </label>
                </div>
            </div>
        `;
    }

    private setLoadingState() {
        const left = this.querySelector('#battle-col-left');
        const right = this.querySelector('#battle-col-right');
        if(left) left.innerHTML = `<div style="margin-top:50px; font-family:var(--font-book); color:#666;">Chargement...</div>`;
        if(right) right.innerHTML = ``;
    }

    private setErrorState() {
        const left = this.querySelector('#battle-col-left');
        if(left) left.innerHTML = `<div style="color:red; margin-top:20px;">Erreur de chargement des données.</div>`;
    }
    // #endregion

    // #region RENDU CONTENU
    // ============================================================================
    private renderContent() {
        if (!this.fullPokemonDetails || !this.member) return;
        const p = this.fullPokemonDetails;
        
        const colLeft = this.querySelector('#battle-col-left');
        const colRight = this.querySelector('#battle-col-right');

        if (!colLeft || !colRight) return;

        const name = I18n.getName(p.name);
        const imgUrl = MediaHandler.getModalImage(p, this.currentMode);
        const pixelClass = this.currentMode === 'legacy' ? 'pixelated' : '';
        
        const typesHTML = this.buildTypesHTML(p);
        const weakHTML = this.buildWeaknessHTML(p);
        const statsHTML = this.buildStatsHTML(p);
        const movesHTML = this.member.selectedMoves.map((move, i) => this.renderMoveCard(move, i)).join('');

        // Injection Gauche
        colLeft.innerHTML = /*html*/ `
            <div class="polaroid-frame sway-active" style="width: 240px; min-height: 280px; padding: 10px; display: flex; flex-direction: column; align-items: center; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin-bottom:20px;">
                <div class="polaroid-image-window" style="width: 216px; height: 216px; display: flex; align-items: center; justify-content: center; background: #fdfdfd; overflow: hidden; border: 1px solid #eee;">
                    <img src="${imgUrl}" class="modal-pokemon-img ${pixelClass}" style="object-fit: contain; width: 100%; height: 100%;">
                </div>
                <h2 style="text-align:center; margin:15px 0 5px 0; font-family:var(--font-stamp); color:#333; font-size:1.8rem;">${name}</h2>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:20px;">${typesHTML}</div>

            <div style="width:100%; background:rgba(255,255,255,0.5); border:1px solid #ccc; border-radius:8px; padding:15px; margin-bottom:15px;">
                <h3 style="margin-bottom:10px; font-family:var(--font-book); text-transform:uppercase; font-size:0.9rem; color:#666;">${I18n.getText('notebook_stats')}</h3>
                ${statsHTML}
            </div>

            <div style="width:100%; background:rgba(255,235,235,0.5); border:1px solid #e0c0c0; border-radius:8px; padding:15px;">
                <h3 style="margin-bottom:8px; font-family:var(--font-book); text-transform:uppercase; font-size:0.9rem; color:#b71c1c;">${I18n.getText('weaknesses')}</h3>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">
                    ${weakHTML}
                </div>
            </div>
        `;

        // Injection Droite
        colRight.innerHTML = /*html*/ `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:2px solid var(--ink-secondary); padding-bottom:10px;">
                <h2 style="font-family:var(--font-book); color:var(--ink-secondary); margin:0;">
                    ${I18n.getText('notebook_moves')}
                </h2>
            </div>
            <div class="moves-grid-vertical" style="display:flex; flex-direction:column; gap:15px;">
                ${movesHTML}
            </div>
            <div id="selector-mount"></div>
        `;

        this.bindDynamicEvents();
    }

    private buildTypesHTML(p: Pokemon): string {
        return p.types.map(t => 
            /*html*/ `<span class="type-badge type-${t}" style="font-size:1rem; padding:4px 12px;">${I18n.translateType(t)}</span>`
        ).join('');
    }

    private buildWeaknessHTML(p: Pokemon): string {
        const effectiveness = TypeCalculator.getWeaknesses(p.types);
        if (effectiveness.weak.length === 0) {
            return /*html*/ `<span style="font-style:italic; font-size:0.9rem; color:#666;">${I18n.getText('no_weakness')}</span>`;
        }
        return effectiveness.weak.map(w => 
            /*html*/ `<span class="type-badge type-${w.type}" style="font-size:0.75rem; padding:2px 8px; margin:2px;">
                ${I18n.translateType(w.type)} 
                <span style="background:white; color:black; border-radius:50%; padding:0 4px; font-size:0.7rem;">x${w.value}</span>
            </span>`
        ).join('');
    }

    private buildStatsHTML(p: Pokemon): string {
        return [
            this.renderStatBar(I18n.getText('hp_short'), p.stats.hp),
            this.renderStatBar(I18n.getText('atk_short'), p.stats.attack),
            this.renderStatBar(I18n.getText('def_short'), p.stats.defense),
            this.renderStatBar(I18n.getText('spAtk_short'), p.stats.specialAttack),
            this.renderStatBar(I18n.getText('spDef_short'), p.stats.specialDefense),
            this.renderStatBar(I18n.getText('vit_short'), p.stats.speed)
        ].join('');
    }

    private renderStatBar(label: string, val: number) {
        let color = '#ff5252'; 
        if (val >= 60) color = '#fb8c00'; 
        if (val >= 90) color = '#4caf50'; 
        if (val >= 120) color = '#29b6f6'; 

        const percent = Math.min((val / 200) * 100, 100);

        return /*html*/ `
            <div style="display:flex; align-items:center; margin-bottom:6px; font-family:var(--font-book); font-size:0.9rem;">
                <span style="width:50px; font-weight:bold; color:#444;">${label}</span>
                <div style="flex:1; height:8px; background:#eee; border-radius:4px; margin:0 10px; overflow:hidden;">
                    <div style="height:100%; width:${percent}%; background:${color}; border-radius:4px;"></div>
                </div>
                <span style="width:30px; text-align:right; font-weight:bold; color:${color};">${val}</span>
            </div>
        `;
    }

    private renderMoveCard(move: MoveLite | null, index: number) {
        if (!move) {
            return /*html*/ `
                <div class="move-card empty" data-index="${index}" style="
                    border: 2px dashed #ccc; border-radius: 8px; height: 120px; 
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; background: #f9f9f9; transition: all 0.2s;
                ">
                    <div style="text-align:center; color:#999;">
                        <div style="font-size:2rem;">+</div>
                        <div style="font-family:var(--font-hand);">${I18n.getText('move_placeholder')}</div>
                    </div>
                </div>
            `;
        }

        const type = move.type || 'normal';
        const category = move.category || 'status';
        const accuracy = (move.accuracy === null || move.accuracy === undefined) ? '∞' : move.accuracy + '%';
        const power = move.power || '-';
        
        let moveNameDisplay = '';
        if (typeof move.name === 'string') {
            moveNameDisplay = move.name; 
        } else {
            moveNameDisplay = I18n.currentLang === 'fr' ? move.name.fr : move.name.en;
        }

        const desc = move.description ? (I18n.currentLang === 'fr' ? move.description.fr : move.description.en) : '...';
        const catIcon = this.ICONS[category as keyof typeof this.ICONS] || this.ICONS.status;

        return /*html*/ `
            <div class="move-card filled" data-index="${index}" style="
                border: 1px solid #ddd; border-left: 6px solid var(--type-${type}); border-radius: 6px; 
                background: white; padding: 15px; position: relative; cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: transform 0.2s;
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="type-badge type-${type}" style="font-size:0.8rem; padding:3px 10px; border-radius:4px; color:white; text-transform:uppercase;">
                            ${I18n.translateType(type)}
                        </span>
                        <span style="font-family:var(--font-book); font-weight:bold; font-size:1.2rem; color:#333;">
                            ${moveNameDisplay}
                        </span>
                    </div>
                    <button class="forget-btn" data-index="${index}" title="Oublier">×</button>
                </div>

                <div style="display:grid; grid-template-columns: 50px 1fr 1fr; gap:15px; align-items:center; margin-bottom:10px;">
                    <div title="${I18n.t('category')}" style="display:flex; justify-content:center;">${catIcon}</div>
                    <div style="font-size:0.95rem; color:#666;">${I18n.t('power')}: <strong style="color:#333;">${power}</strong></div>
                    <div style="font-size:0.95rem; color:#666;">${I18n.t('accuracy')}: <strong style="color:#333; font-size:1.1rem;">${accuracy}</strong></div>
                </div>

                <div style="
                    font-family:var(--font-hand); font-size:1rem; color:#666; font-style:italic;
                    border-top:1px solid #f0f0f0; padding-top:8px; line-height:1.3;
                ">
                    ${desc}
                </div>
            </div>
        `;
    }
    // #endregion

    // #region INTERACTIONS
    // ============================================================================
    private bindStaticEvents() {
        this.querySelector('#close-btn')?.addEventListener('click', () => this.close());
        this.querySelector('#nav-prev')?.addEventListener('click', () => this.navigateCarousel(-1));
        this.querySelector('#nav-next')?.addEventListener('click', () => this.navigateCarousel(1));

        this.bindSwitchEvents();
    }

    private bindSwitchEvents() {
        const toggleHandler = () => {
            const langIn = this.querySelector('#battle-toggle-lang') as HTMLInputElement;
            const modeIn = this.querySelector('#battle-toggle-mode') as HTMLInputElement;
            
            const newLang: Language = langIn.checked ? 'en' : 'fr';
            const newMode: ImageMode = modeIn.checked ? 'legacy' : 'artwork';

            I18n.currentLang = newLang;
            this.currentMode = newMode;

            window.dispatchEvent(new CustomEvent('settings:changed', {
                detail: { lang: newLang, mode: newMode }
            }));
            
            this.renderContent();
        };

        this.querySelector('#battle-toggle-lang')?.addEventListener('change', toggleHandler);
        this.querySelector('#battle-toggle-mode')?.addEventListener('change', toggleHandler);
    }

    private bindDynamicEvents() {
        this.querySelectorAll('.move-card').forEach(card => {
            card.addEventListener('mouseenter', () => (card as HTMLElement).style.transform = 'translateX(5px)');
            card.addEventListener('mouseleave', () => (card as HTMLElement).style.transform = 'translateX(0)');
            card.addEventListener('click', (e) => {
                const idx = Number((e.currentTarget as HTMLElement).dataset.index);
                this.openMoveSelector(idx);
            });
        });

        this.querySelectorAll('.forget-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const idx = Number((e.currentTarget as HTMLElement).dataset.index);
                this.updateMoveAndRender(idx, null);
            });
        });
    }

    private openMoveSelector(slotIndex: number) {
        if (!this.fullPokemonDetails) return;
        const selector = document.createElement('move-selector') as MoveSelector;
        document.body.appendChild(selector);

        const apiMoves = this.fullPokemonDetails.moves || [];
        const currentTechNames = this.member?.selectedMoves
            .filter(m => m !== null)
            .map(selected => {
                const match = apiMoves.find(apiMove => apiMove.url === selected!.url);
                return match ? match.name : '';
            })
            .filter(n => n !== '') || [];

        selector.open(apiMoves.map(m => m.name), currentTechNames);

        selector.onSelect = async (selectedTechnicalName) => {
            const moveData = apiMoves.find(m => m.name === selectedTechnicalName);
            const url = moveData ? moveData.url : '';
            
            const names = PokemonAPI.getMoveName(selectedTechnicalName);
            const tempMove: MoveLite = { name: names, url: url };
            
            this.updateMoveAndRender(slotIndex, tempMove);

            if (url) {
                try {
                    const realDetails = await PokemonAPI.getMoveDetails(url);
                    this.updateMoveAndRender(slotIndex, realDetails);
                } catch (e) { console.error(e); }
            }
        };
    }
    // #endregion
}

customElements.define('battle-prep-modal', BattlePrepModal);