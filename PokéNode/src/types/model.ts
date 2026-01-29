// Types de base
export type PokemonType =
    | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
    | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
    | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type ImageMode = 'artwork' | 'legacy';
export type Language = 'fr' | 'en';

// Structures de données
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
    evolvesTo: EvolutionNode[]; // Structure récursive
}

// Modèle léger (Listes, Recherche, TeamBuilder)
export interface PokemonLite {
    id: number;
    name: string;
    nameEn?: string;      // Pour la recherche bilingue
    url: string;          // Pour charger les détails plus tard
    types: PokemonType[]; // Pour le calcul des faiblesses
    sprite?: string;      // Miniature pixel art
    abilities: {
        fr: string[];
        en: string[];
    };
}

// Modèle complet (Modale de détails)
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

// TeamBuilder : Attaque
export interface MoveLite {
    name: string;
    url: string;
    type?: string;     // Rempli asynchrone
    power?: number;
    accuracy?: number;
    pp?: number;
}

// TeamBuilder : Membre d'équipe
export interface TeamMember extends PokemonLite {
    // 4 attaques (Tuple fixe)
    selectedMoves: [MoveLite | null, MoveLite | null, MoveLite | null, MoveLite | null];
    
    // Stats spécifiques au format compact
    stats?: {
        hp: number; 
        attack: number; 
        defense: number;
        spAtk: number; 
        spDef: number; 
        speed: number;
    };
}

// TeamBuilder : Équipe complète
export interface Team {
    id: string;
    name: string;
    // 6 slots fixes (remplis ou null)
    members: [
        TeamMember | null, TeamMember | null, TeamMember | null, 
        TeamMember | null, TeamMember | null, TeamMember | null
    ];
}