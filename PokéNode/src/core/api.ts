import type { Pokemon, PokemonType, EvolutionNode, PokemonLite } from '../types/model';
import { I18n } from '../services/I18n';

const BASE_URL = 'https://pokeapi.co/api/v2';

// --- LES CACHES (Performance & Optimisation) ---
const pokemonCache = new Map<number, Pokemon>();
const typeCache = new Map<string, any>();
const abilityCache = new Map<string, string>();

export const PokemonAPI = {

    /**
     * Récupère un Pokémon déjà chargé en mémoire
     */
    getCachedPokemon(id: number): Pokemon | undefined {
        return pokemonCache.get(id);
    },

    /**
     * Récupère les relations de dommages (faiblesses/résistances).
     * Mise en cache pour éviter les appels répétitifs.
     */
    async getTypeRelations(type: string): Promise<any> {
        if (typeCache.has(type)) {
            return typeCache.get(type);
        }

        try {
            const res = await fetch(`${BASE_URL}/type/${type}`);
            const data = await res.json();
            const relations = data.damage_relations;

            typeCache.set(type, relations);
            return relations;
        } catch (error) {
            console.error(`Erreur chargement type ${type}`, error);
            return null;
        }
    },

    /**
     * Récupère la liste légère (ID + Nom + URL) de TOUS les Pokémon.
     */
    async getAllPokemonLite(): Promise<PokemonLite[]> {
        const response = await fetch(`${BASE_URL}/pokemon?limit=1500`);
        const data = await response.json();

        // Regex qui cherche le dernier nombre entouré de slashs dans l'URL
        const idRegex = /\/(\d+)\/$/;

        return data.results.map((p: any) => {
            const match = p.url.match(idRegex);
            const id = match ? Number.parseInt(match[1]) : 0;

            return {
                name: p.name,
                url: p.url,
                id: id
            };
        });
    },

    /**
     * Récupère les IDs des Pokémon d'un certain Type.
     */
    async getIdsByType(type: string): Promise<number[]> {
        if (type === 'all') return [];

        try {
            const response = await fetch(`${BASE_URL}/type/${type}`);
            const data = await response.json();

            return data.pokemon.map((p: any) => {
                const parts = p.pokemon.url.split('/');
                return Number.parseInt(parts[parts.length - 2]);
            });
        } catch (e) {
            console.error("Erreur API Type", e);
            return [];
        }
    },

    /**
     * Récupère les IDs des Pokémon d'une Génération.
     * Accepte "generation-i" ou "I".
     */
    async getIdsByGen(gen: string): Promise<number[]> {
        if (gen === 'all') return [];

        // Sécurité : Si on reçoit juste "I", on le transforme en "generation-i"
        let query = gen.toLowerCase();
        if (!query.startsWith('generation-')) {
            query = `generation-${query}`;
        }

        try {
            const response = await fetch(`${BASE_URL}/generation/${query}`);
            const data = await response.json();

            return data.pokemon_species.map((p: any) => {
                const parts = p.url.split('/');
                return Number.parseInt(parts[parts.length - 2]);
            });
        } catch (e) {
            console.error("Erreur API Gen", e);
            return [];
        }
    },

    /**
     * Récupère TOUS les détails d'un Pokémon.
     * Combine les données /pokemon/id et /pokemon-species/id.
     */
    async getPokemonDetails(id: number): Promise<Pokemon> {
        if (pokemonCache.has(id)) {
            return pokemonCache.get(id)!;
        }

        // 1. Appel Données Techniques (Stats, Types, Sprites)
        const pokemonRes = await fetch(`${BASE_URL}/pokemon/${id}`);
        if (!pokemonRes.ok) throw new Error(`Pokemon ${id} not found`);
        const data = await pokemonRes.json();

        // 2. Appel Données Espèce (Noms FR, Description, Evolution, Gen)
        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();

        // --- LOGIQUE DE NOMMAGE (UX) ---
        let nameFr = speciesData.names.find((n: any) => n.language.name === 'fr')?.name || data.name;
        let nameEn = data.name;

        const technicalName = data.name.toLowerCase();

        // Gestion des formes spéciales pour un affichage propre
        if (technicalName.includes('-mega-x')) nameFr = `Méga-${nameFr} X`;
        else if (technicalName.includes('-mega-y')) nameFr = `Méga-${nameFr} Y`;
        else if (technicalName.includes('-mega')) nameFr = `Méga-${nameFr}`;
        else if (technicalName.includes('-gmax')) nameFr = `${nameFr} Gigamax`;
        else if (technicalName.includes('-alola')) nameFr = `${nameFr} d'Alola`;
        else if (technicalName.includes('-galar')) nameFr = `${nameFr} de Galar`;
        else if (technicalName.includes('-hisui')) nameFr = `${nameFr} d'Hisui`;
        else if (technicalName.includes('-paldea')) nameFr = `${nameFr} de Paldea`;
        else if (technicalName.includes('-primal')) nameFr = `${nameFr} Primo`;

        // Formatage Nom EN (mr-mime -> Mr Mime)
        nameEn = nameEn.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        // Détection Génération
        const genApiName = speciesData.generation?.name || "generation-i";
        const genRoman = genApiName.split('-')[1].toUpperCase();

        // Description
        const flavorEntries = speciesData.flavor_text_entries;
        const getDesc = (lang: string) => flavorEntries
                .find((f: any) => f.language.name === lang)?.flavor_text
                ?.replaceAll(/[\n\f]/g, ' ') // En cas de saut de ligne de l'API
            || "Description non disponible.";

        const pokemonFull: Pokemon = {
            id: data.id,
            name: { en: nameEn, fr: nameFr },
            types: data.types.map((t: any) => t.type.name as PokemonType),
            stats: {
                hp: data.stats[0].base_stat,
                attack: data.stats[1].base_stat,
                defense: data.stats[2].base_stat,
                specialAttack: data.stats[3].base_stat,
                specialDefense: data.stats[4].base_stat,
                speed: data.stats[5].base_stat,
            },
            // On nettoie le nom des abilities (overgrow -> Overgrow)
            abilities: data.abilities.map((a: any) => a.ability.name),
            generation: genRoman,
            region: I18n.translateRegion(genRoman),
            height: data.height,
            weight: data.weight,
            evolutionUrl: speciesData.evolution_chain.url,
            description: { fr: getDesc('fr'), en: getDesc('en') },
            sprites: {
                front_default: data.sprites.front_default,
                other: {
                    'official-artwork': {
                        front_default: data.sprites.other['official-artwork'].front_default
                    }
                }
            }
        };

        pokemonCache.set(id, pokemonFull);
        return pokemonFull;
    },

    /**
     * Traduit une capacité (Ability) avec mise en cache.
     */
    async getAbilityTranslation(abilityName: string, lang: 'fr' | 'en'): Promise<string> {
        const cacheKey = `${abilityName}-${lang}`;
        if (abilityCache.has(cacheKey)) {
            return abilityCache.get(cacheKey)!;
        }

        try {
            const res = await fetch(`https://pokeapi.co/api/v2/ability/${abilityName}`);
            const data = await res.json();
            const translation = data.names.find((n: any) => n.language.name === lang);
            const result = translation ? translation.name : abilityName;

            abilityCache.set(cacheKey, result);
            return result;
        } catch (error) {
            return abilityName;
        }
    },

    /**
     * Construit l'arbre d'évolution récursivement
     */
    async getEvolutionChain(url: string): Promise<EvolutionNode> {
        const response = await fetch(url);
        const data = await response.json();

        const buildChain = (chainData: any): EvolutionNode => {
            const parts = chainData.species.url.split('/');
            const id = Number.parseInt(parts[parts.length - 2]);

            return {
                name: chainData.species.name,
                id: id,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
                evolvesTo: chainData.evolves_to.map((evo: any) => buildChain(evo))
            };
        };

        return buildChain(data.chain);
    },

    // --- LISTES DYNAMIQUES (Pour les filtres) ---

    async getTypesList(): Promise<string[]> {
        try {
            const response = await fetch(`${BASE_URL}/type`);
            const data = await response.json();
            return data.results
                .map((t: any) => t.name)
                .filter((t: string) => t !== 'unknown' && t !== 'shadow');
        } catch (e) {
            return ['normal', 'fire', 'water', 'grass', 'electric'];
        }
    },

    async getGenerationsList(): Promise<string[]> {
        try {
            const response = await fetch(`${BASE_URL}/generation`);
            const data = await response.json();
            // On extrait juste le chiffre romain de "generation-viii"
            return data.results.map((g: any) => g.name.split('-')[1].toUpperCase());
        } catch (e) {
            return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        }
    }
};
