import type { Language } from '../types/model';

// #region 1. SCHÉMA DE TRADUCTION (INTERFACES)
// ============================================================================

interface TranslationSchema {
    // --- POKEDEX GENERAL ---
    search_placeholder: string;
    loading: string;
    no_results: string;
    weight: string;
    height: string;
    cry: string;
    cry_missing: string;
    evolutions: string;
    filter_type: string;
    filter_gen: string;
    all_gen: string;
    prev_page: string;
    next_page: string;
    page_of: string;
    go_to: string;
    region: string;
    mode_artwork: string;
    mode_legacy: string;
    abilities: string;
    generation: string;

    // --- TEAM BUILDER & CARNET ---
    team_title: string;
    team_title_single: string;
    new_team: string;
    add_pokemon: string;
    empty_slot: string;
    tear_page: string;
    tear_confirm: string;

    // --- MINI DEX (RECRUTEMENT) ---
    recruit_title: string;
    search_placeholder_short: string;
    close: string;

    // --- GRIMOIRE DE COMBAT (BATTLE MODAL) ---
    notebook_stats: string;
    notebook_moves: string;
    notebook_empty_move: string;
    move_placeholder: string;
    chose_move: string;
    weaknesses_label: string;
    no_weakness: string;
    weaknesses: string;
    resistances: string;

    // --- NOTIFICATION ---
    btn_confirm: string;
    btn_cancel: string;
    btn_understood: string;

    // --- ABREVIATIONS STATS (UI) ---
    hp_short: string;
    atk_short: string;
    def_short: string;
    spAtk_short: string;
    spDef_short: string;
    vit_short: string;

    // --- DICTIONNAIRES COMPLEXES (Listes de valeurs) ---
    regions: Record<string, string>;
    types: Record<string, string>;
    stats: Record<string, string>;
}
// #endregion

// #region 2. DONNÉES (DICTIONNAIRES)
// ============================================================================

const dictionary: Record<Language, TranslationSchema> = {
    fr: {
        // Textes UI
        search_placeholder: "Rechercher (Nom, ID, Talent...)",
        loading: "Chargement...",
        no_results: "Aucun Pokémon trouvé.",
        weight: "Poids",
        height: "Taille",
        cry: "Cri",
        cry_missing: "Muet",
        evolutions: "Arbre d'Évolution",
        filter_type: "Type",
        filter_gen: "Génération",
        all_gen: "Toutes",
        prev_page: "Préc.",
        next_page: "Suiv.",
        page_of: "sur",
        go_to: "Aller à",
        region: "Région",
        mode_artwork: "Artistique",
        mode_legacy: "Rétro",
        abilities: "Talents",
        generation: "Génération",
        weaknesses: "Faiblesses",
        resistances: "Résistances",

        // Team Builder
        team_title: "Vos Carnets de Route",
        team_title_single: "Votre Carnet de Route",
        new_team: "+ Nouvelle Page",
        add_pokemon: "Ajouter",
        empty_slot: "?",
        tear_page: "Arracher la page",
        tear_confirm: "Voulez-vous vraiment arracher cette page et perdre cette équipe ?",

        // Mini Dex
        recruit_title: "Recrutement",
        search_placeholder_short: "Rechercher (Nom ou ID)...",
        close: "Fermer",

        // Battle Modal
        notebook_stats: "Statistiques",
        notebook_moves: "Techniques (4 max)",
        notebook_empty_move: "Emplacement vide",
        move_placeholder: "Chercher une technique...",
        chose_move: "Choisir une Attaque",
        weaknesses_label: "⚠️ Attention aux :",
        no_weakness: "Aucune faiblesse majeure.",

        // Abréviations
        hp_short: "PV",
        atk_short: "ATK",
        def_short: "DEF",
        spAtk_short: "ATK.SP",
        spDef_short: "DEF.SP",
        vit_short: "VIT",
        btn_confirm: "Confirmer",
        btn_cancel: "Annuler",
        btn_understood: "Bien reçu",

        // Listes
        regions: {
            kanto: "Kanto", johto: "Johto", hoenn: "Hoenn", sinnoh: "Sinnoh",
            unova: "Unys", kalos: "Kalos", alola: "Alola", galar: "Galar", paldea: "Paldea"
        },
        types: {
            grass: "Plante", fire: "Feu", water: "Eau", bug: "Insecte", normal: "Normal",
            poison: "Poison", electric: "Électrik", ground: "Sol", fairy: "Fée",
            fighting: "Combat", psychic: "Psy", rock: "Roche", ghost: "Spectre",
            ice: "Glace", dragon: "Dragon", steel: "Acier", dark: "Ténèbres", flying: "Vol"
        },
        stats: {
            hp: "PV", attack: "Attaque", defense: "Défense",
            specialAttack: "Attaque.Spé", specialDefense: "Défense.Spé", speed: "Vitesse"
        }
    },
    en: {
        // UI Texts
        search_placeholder: "Search (Name, ID, Ability...)",
        loading: "Loading...",
        no_results: "No Pokemon found.",
        weight: "Weight",
        height: "Height",
        cry: "Cry",
        cry_missing: "Muted",
        evolutions: "Evolution Tree",
        filter_type: "Type",
        filter_gen: "Generation",
        all_gen: "All",
        prev_page: "Prev.",
        next_page: "Next",
        page_of: "of",
        go_to: "Go to",
        region: "Region",
        mode_artwork: "Artistic",
        mode_legacy: "Retro",
        abilities: "Abilities",
        generation: "Generation",
        weaknesses: "Weaknesses",
        resistances: "Resistances",

        // Team Builder
        team_title: "Your Adventure Logs",
        team_title_single: "Your Adventure Log",
        new_team: "+ New Page",
        add_pokemon: "Add",
        empty_slot: "?",
        tear_page: "Tear page",
        tear_confirm: "Do you really want to tear this page and lose this team?",

        // Mini Dex
        recruit_title: "Recruitment",
        search_placeholder_short: "Search (Name or ID)...",
        close: "Close",

        // Battle Modal
        notebook_stats: "Statistics",
        notebook_moves: "Moves (Max 4)",
        notebook_empty_move: "Empty Slot",
        move_placeholder: "Search for a move...",
        chose_move: "Chose a Move",
        weaknesses_label: "⚠️ Watch out for:",
        no_weakness: "No major weakness.",

        // Abbreviations
        hp_short: "HP",
        atk_short: "ATK",
        def_short: "DEF",
        spAtk_short: "SP.ATK",
        spDef_short: "SP.DEF",
        vit_short: "SPD",
        btn_confirm: "Confirm",
        btn_cancel: "Cancel",
        btn_understood: "Understood",

        // Lists
        regions: {
            kanto: "Kanto", johto: "Johto", hoenn: "Hoenn", sinnoh: "Sinnoh",
            unova: "Unova", kalos: "Kalos", alola: "Alola", galar: "Galar", paldea: "Paldea"
        },
        types: {
            grass: "Grass", fire: "Fire", water: "Water", bug: "Bug", normal: "Normal",
            poison: "Poison", electric: "Electric", ground: "Ground", fairy: "Fairy",
            fighting: "Fighting", psychic: "Psychic", rock: "Rock", ghost: "Ghost",
            ice: "Ice", dragon: "Dragon", steel: "Steel", dark: "Dark", flying: "Flying"
        },
        stats: {
            hp: "HP", attack: "Attack", defense: "Defense",
            specialAttack: "Sp. Attack", specialDefense: "Sp. Defense", speed: "Speed"
        }
    }
};
// #endregion

// #region 3. SERVICE I18N
// ============================================================================

export class I18n {
    
    // Langue actuelle de l'application (modifiée par les réglages)
    static currentLang: Language = 'fr';

    // Map statique pour convertir les Générations (I, II) en régions (kanto, johto)
    private static readonly GEN_TO_REGION: Record<string, string> = {
        'I': 'kanto', 'II': 'johto', 'III': 'hoenn', 'IV': 'sinnoh',
        'V': 'unova', 'VI': 'kalos', 'VII': 'alola', 'VIII': 'galar', 'IX': 'paldea'
    };

    /**
     * Récupère une traduction simple (chaîne de caractères).
     * @param key La clé de traduction (ex: 'search_placeholder')
     */
    static t(key: keyof TranslationSchema): string {
        const val = dictionary[this.currentLang][key];
        
        // Sécurité : Si on demande 'regions' ou 'types' (qui sont des objets) via t(),
        // on retourne une chaine vide pour ne pas faire planter l'UI [object Object].
        if (typeof val === 'string') {
            return val;
        }
        return '';
    }

    /**
     * Alias de t() pour compatibilité avec certains composants.
     */
    static getText(key: keyof TranslationSchema): string {
        return this.t(key);
    }

    /**
     * Traduit un type de Pokémon (ex: 'fire' -> 'Feu').
     */
    static translateType(type: string): string {
        const types = dictionary[this.currentLang].types;
        const key = type.toLowerCase();
        return types[key] || type; // Fallback sur l'anglais si non trouvé
    }

    /**
     * Traduit une statistique (ex: 'specialAttack' -> 'Attaque Spéciale').
     */
    static translateStat(stat: string): string {
        const stats = dictionary[this.currentLang].stats;
        return stats[stat] || stat;
    }

    /**
     * Traduit une région à partir de son numéro de génération.
     * @param gen ex: "I", "IV", "Gen 1"
     */
    static translateRegion(gen: string): string {
        // Nettoyage : "Generation-I" -> "I"
        const cleanGen = gen.replace('generation-', '').replace('Generation-', '').toUpperCase();
        
        const regionKey = this.GEN_TO_REGION[cleanGen] || 'kanto';
        const regions = dictionary[this.currentLang].regions;

        return regions[regionKey] || gen;
    }

    /**
     * Helper pour choisir le nom d'un Pokémon selon la langue courante.
     */
    static getName(nameObj: { fr: string; en: string }): string {
        return this.currentLang === 'fr' ? nameObj.fr : nameObj.en;
    }
}
// #endregion