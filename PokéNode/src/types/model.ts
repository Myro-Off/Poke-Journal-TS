export type PokemonType =
    | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
    | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
    | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type ImageMode = 'artwork' | 'legacy';
export type Language = 'fr' | 'en';

export interface Stats {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
}

// Structure d'arbre pour les évolutions
export interface EvolutionNode {
    name: string;
    id: number;
    image: string;
    evolvesTo: EvolutionNode[];
}

// Pokémon "Léger" pour l'index de recherche global (chargement rapide)
export interface PokemonLite {
    name: string;
    url: string;
    id: number;
}

// Pokémon Complet
export interface Pokemon {
    id: number;
    name: { fr: string; en: string; };
    types: PokemonType[];
    stats: Stats;
    abilities: string[];
    generation: string;
    region: string;
    height: number;
    weight: number;
    evolutionUrl: string;
    description: { fr: string; en: string; };
    sprites: {
        front_default: string | null;
        other: {
            'official-artwork': {
                front_default: string | null;
            };
        };
    };
}
