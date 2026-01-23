import type { PokemonType } from '../types/model';

const ALL_TYPES: PokemonType[] = [
    'normal', 'fire', 'water', 'grass', 'electric', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

export interface EffectivenessResult {
    weak: { type: PokemonType; value: number }[];
    resist: { type: PokemonType; value: number }[];
    immune: { type: PokemonType; value: number }[];
}

export class TypeCalculator {
    /**
     * Calcule les faiblesses cumulées basées sur les données API
     */
    static calculateFromApi(damageRelationsList: any[]): EffectivenessResult {
        const multipliers: Record<string, number> = {};

        // 1. Init à x1
        ALL_TYPES.forEach(t => multipliers[t] = 1);

        // 2. Traitement des relations
        if (Array.isArray(damageRelationsList)) {
            damageRelationsList.flat().forEach(relData => {
                if (!relData) return;

                // Sécurité : L'API met parfois les données dans 'damage_relations', parfois à la racine
                const data = relData.damage_relations || relData;

                data.double_damage_from?.forEach((t: any) => {
                    if (multipliers[t.name] !== undefined) multipliers[t.name] *= 2;
                });

                data.half_damage_from?.forEach((t: any) => {
                    if (multipliers[t.name] !== undefined) multipliers[t.name] *= 0.5;
                });

                data.no_damage_from?.forEach((t: any) => {
                    if (multipliers[t.name] !== undefined) multipliers[t.name] = 0;
                });
            });
        }

        // 3. Tri et formatage
        const result: EffectivenessResult = { weak: [], resist: [], immune: [] };

        ALL_TYPES.forEach(type => {
            const value = multipliers[type];
            if (value === 1) return; // On ignore le neutre

            const entry = { type, value };

            if (value === 0) {
                result.immune.push(entry);
            } else if (value > 1) {
                result.weak.push(entry);
            } else if (value < 1) {
                result.resist.push(entry);
            }
        });

        // Tri : Plus faiblesse est grande, plus elle est en haut (x4 avant x2)
        result.weak.sort((a, b) => b.value - a.value);

        // Tri : Plus résistance est petite, plus elle est importante (x0 avant x0.25)
        result.resist.sort((a, b) => a.value - b.value);

        return result;
    }
}
