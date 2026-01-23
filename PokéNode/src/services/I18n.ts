import type { Language } from '../types/model';

interface TranslationSchema {
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
    weaknesses: string;
    resistances: string;
    regions: Record<string, string>;
    types: Record<string, string>;
    stats: Record<string, string>;
}

const dictionary: Record<Language, TranslationSchema> = {
    fr: {
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
        mode_artwork: "HD",
        mode_legacy: "Pixel",
        abilities: "Talents",
        generation: "Génération",
        weaknesses: "Faiblesses",
        resistances: "Résistances",
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
            specialAttack: "Att. Spé", specialDefense: "Déf. Spé", speed: "Vitesse"
        }
    },
    en: {
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
        mode_artwork: "HD",
        mode_legacy: "Pixel",
        abilities: "Abilities",
        generation: "Generation",
        weaknesses: "Weaknesses",
        resistances: "Resistances",
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
            specialAttack: "Sp. Atk", specialDefense: "Sp. Def", speed: "Speed"
        }
    }
};

export class I18n {
    static currentLang: Language = 'fr';

    static t(key: keyof TranslationSchema): string {
        const val = dictionary[this.currentLang][key];
        if (typeof val === 'string') {
            return val;
        }
        return String(key);
    }

    static translateType(type: string): string {
        const types = dictionary[this.currentLang].types;
        const key = type.toLowerCase();
        return types[key] || type;
    }

    static translateStat(stat: string): string {
        const stats = dictionary[this.currentLang].stats;
        return stats[stat] || stat;
    }

    static translateRegion(gen: string): string {
        const map: Record<string, string> = {
            'I': 'kanto', 'II': 'johto', 'III': 'hoenn', 'IV': 'sinnoh',
            'V': 'unova', 'VI': 'kalos', 'VII': 'alola', 'VIII': 'galar','IX': 'paldea'
        };

        const regionKey = map[gen] || 'kanto';
        const regions = dictionary[this.currentLang].regions;

        return regions[regionKey] || gen;
    }

    static getName(nameObj: { fr: string; en: string }): string {
        return this.currentLang === 'fr' ? nameObj.fr : nameObj.en;
    }
}
