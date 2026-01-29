import type { Pokemon, ImageMode, EvolutionNode, Language, Stats } from '../../../types/model';
import { MediaHandler } from '../../../utils/MediaHandler';
import { TypeCalculator } from '../../../utils/TypeCalculator';
import { I18n } from '../../../services/I18n';

export const ModalTemplates = {

    // #region STRUCTURE GLOBALE (COQUILLE)
    // ============================================================================
    getBaseHTML(currentLang: string, currentMode: string): string {
        return /*html*/ `
            <div id="pokemon-modal" class="modal-overlay" style="display: none;">
                <button id="prev-pokemon" class="modal-nav-btn prev">❮</button>
                <button id="next-pokemon" class="modal-nav-btn next">❯</button>

                <div class="modal-content">
                    <button id="close-modal" class="close-btn" aria-label="Fermer">
                        <div class="close-icon"><span class="line"></span><span class="line"></span></div>
                    </button>
                    
                    <div class="modal-settings-wrapper">
                        <div class="switch-container">
                            <label class="poke-switch">
                                <input type="checkbox" id="modal-toggle-lang" ${currentLang === 'en' ? 'checked' : ''}>
                                <span class="poke-slider"></span>
                                <span class="switch-label">FR</span>
                                <span class="switch-label">EN</span>
                            </label>
                        </div>
                        <div class="switch-container">
                            <label class="poke-switch">
                                <input type="checkbox" id="modal-toggle-mode" ${currentMode === 'legacy' ? 'checked' : ''}>
                                <span class="poke-slider"></span>
                                <span class="switch-label">HD</span>
                                <span class="switch-label">Pix</span>
                            </label>
                        </div>
                    </div>

                    <div id="modal-body" style="height:100%"></div>
                </div>
            </div>
        `;
    },
    // #endregion

    // #region CONTENU DU POKÉMON (BODY)
    // ============================================================================
    getPokemonContentHTML(pokemon: Pokemon, mode: ImageMode, lang: Language, evoChain: EvolutionNode | null): string {
        const name = lang === 'fr' ? pokemon.name.fr : pokemon.name.en;
        const desc = lang === 'fr' ? pokemon.description.fr : pokemon.description.en;
        const abilities = pokemon.abilities.join(', ');
        const generation = pokemon.generation || 'Gen I';
        const region = pokemon.region || 'Kanto';

        const imgUrl = MediaHandler.getModalImage(pokemon, mode);
        const pixelClass = mode === 'legacy' ? 'pixelated' : '';
        const shadowStyle = "box-shadow: 0 4px 15px rgba(0,0,0,0.2);";

        return /*html*/ `
            <div class="modal-layout">
                <div class="modal-visual">
                    <div class="polaroid-frame sway-active" style="width: 240px; min-height: 280px; padding: 10px; display: flex; flex-direction: column; align-items: center; background: white; ${shadowStyle}">
                        <div class="polaroid-image-window" style="width: 216px; height: 216px; display: flex; align-items: center; justify-content: center; background: #fdfdfd; overflow: hidden; border: 1px solid #eee;">
                            <img src="${imgUrl}" 
                                 id="modal-main-img" 
                                 alt="${name}"
                                 width="300" height="300"
                                 class="modal-pokemon-img ${pixelClass}"
                                 style="object-fit: contain; width: 100%; height: 100%;">
                        </div>
                        <div class="polaroid-id" style="margin-top: 10px; font-weight:bold; color:#555;">#${pokemon.id.toString().padStart(3, '0')}</div>
                    </div>

                    <div id="modal-meta" class="modal-meta-grid">
                        <div class="meta-cell"><span class="meta-label">${I18n.t('generation')}</span> <span class="meta-value">${generation}</span></div>
                        <div class="meta-cell"><span class="meta-label">${I18n.t('region')}</span> <span class="meta-value">${region}</span></div>
                        <div class="meta-cell"><span class="meta-label">${I18n.t('height')}</span> <span class="meta-value">${pokemon.height/10} m</span></div>
                        <div class="meta-cell"><span class="meta-label">${I18n.t('weight')}</span> <span class="meta-value">${pokemon.weight/10} kg</span></div>
                        <div class="meta-cell full"><span class="meta-label">${I18n.t('abilities')}</span> <span class="meta-value meta-value-abilities">${abilities}</span></div>
                    </div>

                    <div id="modal-efficacies" class="efficacy-compact-container">
                        <div class="eff-group-compact">
                            <div class="eff-header"><span class="eff-title">${I18n.t('weaknesses')}</span></div>
                            <div id="modal-weak-list" class="eff-list-compact">${I18n.t('loading')}...</div>
                        </div>
                        <div class="eff-group-compact">
                            <div class="eff-header"><span class="eff-title">${I18n.t('resistances')}</span></div>
                            <div id="modal-resist-list" class="eff-list-compact">${I18n.t('loading')}...</div>
                        </div>
                    </div>
                </div>

                <div class="modal-infos" style="margin-top: 1rem;">
                    <div class="modal-header"><h2 id="modal-title-name">${name}</h2></div>
                    
                    <div class="modal-types" style="display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-top:10px;">
                        ${pokemon.types.map(t => `<span class="type-badge type-${t}">${I18n.translateType(t)}</span>`).join('')}
                        
                        <div id="cry-container">
                            <button id="play-cry" class="cry-pill" disabled style="opacity: 0.6; cursor: wait;">
                                <span class="cry-icon">
                                    <span class="speaker-base"></span>
                                    <span class="sound-waves"><span></span><span></span><span></span></span>
                                </span>
                                <span class="cry-label" style="font-weight:bold; margin-left:5px;">${I18n.t('cry')}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flavor-text" style="margin-top:20px;">
                        "${desc}"
                    </div>
                    
                    <div id="modal-stats-list" class="modal-stats" style="margin-top:20px;">
                        ${this.generateStatsHTML(pokemon.stats)}
                    </div>
                    
                    <div class="modal-evolutions">
                        <h3>${I18n.t('evolutions')}</h3>
                        <div id="modal-evo-content">
                            ${evoChain ?
                                /*html*/ `<div class="evo-tree-container" style="display:flex; justify-content:center; overflow-x:auto; padding:10px;">${this.buildEvolutionHTML(evoChain, mode)}</div>`
                                : `<div class="evo-loading" style="min-height: 100px; display: flex; align-items: center; justify-content: center;">${I18n.t('loading')}...</div>`}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    // #endregion

    // #region SOUS-COMPOSANTS (STATS, ÉVOLUTIONS, TYPES)
    // ============================================================================
    
    /**
     * Génère les barres de progression pour les statistiques.
     * Attend l'objet Stats structuré du modèle (hp, attack, etc.).
     */
    generateStatsHTML(stats: Stats): string {
        if (!stats) return '';
        
        // On transforme l'objet { hp: 50, attack: 100 } en tableau de paires [['hp', 50], ['attack', 100]]
        return Object.entries(stats).map(([key, value]) => {
            const val = Number(value);
            // Calcul du pourcentage (basé sur 150 comme max arbitraire pour l'UI)
            const percent = Math.min(100, (val / 150) * 100);

            // Code couleur dynamique
            let color = '#4caf50'; // Vert (Bon)
            if (val < 50) color = '#ff5252'; // Rouge (Faible)
            else if (val < 90) color = '#fb8c00'; // Orange (Moyen)

            return /*html*/ `
            <div class="stat-row">
                <span class="stat-name">${I18n.translateStat(key)}</span>
                <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${percent}%; background-color:${color};"></div></div>
                <span class="stat-val">${val}</span>
            </div>`;
        }).join('');
    },

    /**
     * Génère l'arbre d'évolution récursif.
     */
    buildEvolutionHTML(node: EvolutionNode, mode: ImageMode): string {
        // On crée un faux objet Pokemon minimal juste pour utiliser le MediaHandler
        const tempP = { id: node.id } as Pokemon;
        const imgUrl = MediaHandler.getModalImage(tempP, mode);
        const placeholder = MediaHandler.getPlaceholder(mode);
        const pixelClass = mode === 'legacy' ? 'pixelated' : '';

        // Le noeud parent (ex: Evoli)
        let html = /*html*/ `
            <div class="evo-node clickable-evo" data-id="${node.id}" style="display:flex; flex-direction:column; align-items:center; margin: 5px;">
                <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background:white; border-radius:50%;">
                    <img src="${imgUrl}" width="60" height="60" class="evo-img ${pixelClass}" style="object-fit: contain; width:100%; height:100%;" onerror="this.onerror=null; this.src='${placeholder}';">
                </div>
                <span class="evo-name" style="margin-top:5px; font-weight:bold; font-size:0.9rem;">${node.name}</span>
            </div>
        `;

        // Les enfants (Récursif)
        if (node.evolvesTo?.length > 0) {
            html += /*html*/ `<div class="evo-arrow" style="margin: 0 10px;"></div>`;
            const childrenHtml = node.evolvesTo.map(child => this.buildEvolutionHTML(child, mode)).join('');

            html += /*html*/ `
                <div style="display:flex; flex-wrap:wrap; justify-content:center; align-items:center; max-width: 300px;">
                    ${childrenHtml}
                </div>
            `;
        }

        return /*html*/ `<div class="evo-group" style="display:flex; align-items:center; flex-direction:row;">${html}</div>`;
    },

    /**
     * Utilise le TypeCalculator pour générer les badges de faiblesses/résistances.
     */
    getEfficaciesHTML(types: string[]): { weak: string, resist: string } {
        const effectiveness = TypeCalculator.getWeaknesses(types);

        const buildBadges = (list: { type: string, value: number }[]) => {
            if (list.length === 0) return /*html*/ `<span class="empty-msg" style="opacity:0.6;">-</span>`;

            return list.map(item => {
                let valDisplay = `x${item.value}`;
                if (item.value === 0.5) valDisplay = '1/2';
                if (item.value === 0.25) valDisplay = '1/4';

                let specialClass = '';
                if (item.value >= 4) specialClass = 'is-super-weak';
                if (item.value === 0) specialClass = 'is-immune';

                return /*html*/ `
                    <div class="eff-badge type-${item.type} ${specialClass}">
                        <span class="eff-name">${I18n.translateType(item.type)}</span>
                        <span class="eff-val">${valDisplay}</span>
                    </div>
                `;
            }).join('');
        };

        return {
            weak: buildBadges(effectiveness.weak),
            resist: buildBadges([...effectiveness.immune, ...effectiveness.resist])
        };
    }
    // #endregion
};