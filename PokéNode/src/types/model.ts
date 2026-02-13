// #region TYPES DE BASE
// ============================================================================
export type PokemonType =
    | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
    | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
    | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type ImageMode = 'artwork' | 'legacy';
export type Language = 'fr' | 'en';
// #endregion

// #region STRUCTURES PARTAGÉES
// ============================================================================
export interface Stats {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
}

export interface EvolutionNode {
    name: string;
    id: number;
    image: string;
    evolvesTo: EvolutionNode[];
}
// #endregion

// #region MODÈLES POKÉDEX (LITE & FULL)
// ============================================================================
export interface PokemonLite {
    id: number;
    name: string;
    nameEn?: string;
    url: string;
    types: PokemonType[];
    sprite?: string;
    abilities: {
        fr: string[];
        en: string[];
    };
}

export interface Pokemon {
    id: number;
    name: { fr: string; en: string; };
    types: PokemonType[];
    stats: Stats;
    abilities: string[];
    moves: { name: string; url: string }[];
    
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
// #endregion

// #region MODÈLES TEAM BUILDER
// ============================================================================
export interface MoveLite {
    name: { fr: string; en: string } | string;
    url: string;
    type?: string;     
    power?: number;
    accuracy?: number;
    pp?: number;
    category?: 'physical' | 'special' | 'status'; 
    description?: { fr: string; en: string };     
}

export interface TeamMember extends PokemonLite {
    selectedMoves: [MoveLite | null, MoveLite | null, MoveLite | null, MoveLite | null];
    
    stats?: {
        hp: number; 
        attack: number; 
        defense: number;
        spAtk: number; 
        spDef: number; 
        speed: number;
    };
}

export interface Team {
    id: string;
    name: string;
    members: [
        TeamMember | null, TeamMember | null, TeamMember | null, 
        TeamMember | null, TeamMember | null, TeamMember | null
    ];
}
// #endregion