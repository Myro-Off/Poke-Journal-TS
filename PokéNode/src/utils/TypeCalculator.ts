export interface EffectivenessResult {
    weak: { type: string; value: number }[];
    resist: { type: string; value: number }[];
    immune: { type: string; value: number }[];
}

// Matrice complète des types (Attaquant -> Défenseur)
// 2 = Super Efficace, 0.5 = Pas très efficace, 0 = Immunisé
const TYPE_CHART: Record<string, Record<string, number>> = {
    normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
    fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
    poison:   { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
    ground:   { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
    flying:   { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
    psychic:  { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
    bug:      { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
    rock:     { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    ghost:    { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
    dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
    dark:     { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
    steel:    { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
    fairy:    { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
};

const ALL_TYPES = Object.keys(TYPE_CHART);

export class TypeCalculator {

    /**
     * Calcule les faiblesses défensives d'un Pokémon instantanément
     * @param types Les types du Pokémon (ex: ['fire', 'flying'])
     */
    static getWeaknesses(types: string[]): EffectivenessResult {
        const multipliers: Record<string, number> = {};

        // 1. Initialisation à x1 partout
        ALL_TYPES.forEach(t => multipliers[t] = 1);

        // 2. Calcul des multiplicateurs
        // Pour chaque type possible d'ATTAQUE
        ALL_TYPES.forEach(attackerType => {
            // on regarde comment il tape sur les types du DÉFENSEUR
            types.forEach(defenderType => {
                // Par défaut x1 si pas dans la liste
                let factor = 1;

                // Si la relation existe dans la table, on l'applique
                if (TYPE_CHART[attackerType] && TYPE_CHART[attackerType][defenderType] !== undefined) {
                    factor = TYPE_CHART[attackerType][defenderType];
                }

                multipliers[attackerType] *= factor;
            });
        });

        // 3. Tri et formatage
        const result: EffectivenessResult = { weak: [], resist: [], immune: [] };

        for (const [type, value] of Object.entries(multipliers)) {
            const entry = { type, value };
            if (value === 0) result.immune.push(entry);
            else if (value > 1) result.weak.push(entry);
            else if (value < 1) result.resist.push(entry);
        }

        // Tri par importance (x4 avant x2, x0.25 avant x0.5)
        result.weak.sort((a, b) => b.value - a.value);
        result.resist.sort((a, b) => a.value - b.value);

        return result;
    }
}
