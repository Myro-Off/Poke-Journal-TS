import type { Pokemon, PokemonType, EvolutionNode, PokemonLite, MoveLite } from '../types/model';
import { I18n } from '../services/I18n';

// #region 0. INTERFACES API (TYPAGE STRICT)
// ============================================================================

// --- GraphQL Types ---
interface GQLName { name: string; language_id: number; }
interface GQLSpecies { id: number; name: string; pokemon_v2_pokemonspeciesnames: GQLName[]; }
interface GQLAbility { id: number; name: string; pokemon_v2_abilitynames: GQLName[]; }
interface GQLPokemonVariant {
    id: number;
    name: string;
    pokemon_species_id: number;
    pokemon_v2_pokemontypes: { pokemon_v2_type: { name: string } }[];
    pokemon_v2_pokemonabilities: { pokemon_v2_ability: { id: number } }[];
}

// --- REST API Types ---
interface ApiName { name: string; language: { name: string } }
interface ApiFlavorText { flavor_text: string; language: { name: string } }
interface ApiChainLink {
    species: { name: string; url: string };
    evolves_to: ApiChainLink[];
}

interface ApiEvolutionChain { chain: ApiChainLink }
interface ApiPokemon {
    id: number;
    name: string;
    height: number;
    weight: number;
    types: { type: { name: string } }[];
    abilities: { ability: { name: string } }[];
    stats: { base_stat: number; stat: { name: string } }[];
    moves: { move: { name: string; url: string } }[];
    sprites: {
        front_default: string | null;
        other: { 'official-artwork': { front_default: string | null } };
    };
    species: { url: string };
}

interface ApiSpecies {
    names: ApiName[];
    flavor_text_entries: ApiFlavorText[];
    generation: { name: string };
    evolution_chain: { url: string };
}

interface ApiMove {
    name: string;
    names: ApiName[];
    type: { name: string };
    power: number;
    accuracy: number;
    pp: number;
}
// #endregion

// #region 1. CONFIGURATION & CACHE
// ============================================================================
const BASE_URL = 'https://pokeapi.co/api/v2';
const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';

// Cache mémoire
const pokemonCache = new Map<number, Pokemon>();
const typeCache = new Map<string, unknown>(); 
const abilityCache = new Map<string, string>();

// Cache pour la "Big List"
let _globalLiteCache: PokemonLite[] = [];
// #endregion

export const PokemonAPI = {

    // #region 2. GESTION DU CACHE
    // ------------------------------------------------------------------------
    getCachedPokemon(id: number): Pokemon | undefined {
        return pokemonCache.get(id);
    },
    // #endregion

    // #region 3. RÉCUPÉRATION GLOBALE
    // ------------------------------------------------------------------------

    async getAllPokemonLite(): Promise<PokemonLite[]> {
        if (_globalLiteCache.length > 0) return _globalLiteCache;

        try {
            const [speciesMap, abilitiesMap] = await Promise.all([
                this.fetchAllSpeciesNames(),
                this.fetchAllAbilityNames()
            ]);

            const pokemons = await this.fetchAllPokemonVariants();

            _globalLiteCache = pokemons.map((p: GQLPokemonVariant) => {
                const speciesId = p.pokemon_species_id;

                // --- A. TRAITEMENT DU NOM ---
                let techName = p.name || "unknown";
                techName = techName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                const speciesNameFr = speciesMap.get(speciesId) || techName;
                let finalNameFr = speciesNameFr;

                // Logique variants
                if (!techName.toLowerCase().includes(speciesNameFr.toLowerCase()) && p.name.includes('-')) {
                    const rawName = p.name;
                    if (rawName.includes('-mega-x')) finalNameFr = `Méga-${speciesNameFr} X`;
                    else if (rawName.includes('-mega-y')) finalNameFr = `Méga-${speciesNameFr} Y`;
                    else if (rawName.includes('-mega')) finalNameFr = `Méga-${speciesNameFr}`;
                    else if (rawName.includes('-gmax')) finalNameFr = `${speciesNameFr} Gigamax`;
                    else if (rawName.includes('-alola')) finalNameFr = `${speciesNameFr} d'Alola`;
                    else if (rawName.includes('-galar')) finalNameFr = `${speciesNameFr} de Galar`;
                    else if (rawName.includes('-hisui')) finalNameFr = `${speciesNameFr} d'Hisui`;
                    else if (rawName.includes('-paldea')) finalNameFr = `${speciesNameFr} de Paldea`;
                    else if (rawName.includes('-primal')) finalNameFr = `Primo-${speciesNameFr}`;
                }
                finalNameFr = finalNameFr.charAt(0).toUpperCase() + finalNameFr.slice(1);

                // --- B. TRAITEMENT DES TYPES ---
                const types = p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name);

                // --- C. TRAITEMENT DES TALENTS ---
                const pokemonAbilityIds = p.pokemon_v2_pokemonabilities.map(pa => pa.pokemon_v2_ability.id);
                
                const abilitiesFr: string[] = [];
                const abilitiesEn: string[] = [];

                pokemonAbilityIds.forEach((id) => {
                    const names = abilitiesMap.get(id);
                    if (names) {
                        if (names.fr) abilitiesFr.push(names.fr);
                        if (names.en) abilitiesEn.push(names.en);
                    }
                });

                return {
                    id: p.id,
                    name: finalNameFr,
                    nameEn: techName,
                    url: `${BASE_URL}/pokemon/${p.id}/`,
                    types: types as PokemonType[],
                    abilities: { fr: abilitiesFr, en: abilitiesEn }
                };
            });

            return _globalLiteCache;

        } catch (e) {
            console.warn("⚠️ Échec stratégie Split Query, passage en mode secours (REST).", e);
            return this.getAllPokemonLiteFallback();
        }
    },

    async fetchAllSpeciesNames(): Promise<Map<number, string>> {
        const query = `query { pokemon_v2_pokemonspecies(order_by: {id: asc}) { id name pokemon_v2_pokemonspeciesnames(where: {language_id: {_eq: 5}}) { name } } }`;
        try {
            const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query}) });
            const json = await res.json();
            const map = new Map<number, string>();
            
            if (json.data?.pokemon_v2_pokemonspecies) {
                // Typage explicite de 's' via l'interface GQLSpecies
                json.data.pokemon_v2_pokemonspecies.forEach((s: GQLSpecies) => {
                    const name = s.pokemon_v2_pokemonspeciesnames[0]?.name || s.name;
                    map.set(s.id, name);
                });
            }
            return map;
        } catch { return new Map(); }
    },

    async fetchAllAbilityNames(): Promise<Map<number, { fr: string, en: string }>> {
        const query = `
            query {
                pokemon_v2_ability {
                    id
                    name
                    pokemon_v2_abilitynames(where: {language_id: {_in: [5, 9]}}) {
                        name
                        language_id
                    }
                }
            }
        `;

        try {
            const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const json = await res.json();
            const map = new Map<number, { fr: string, en: string }>();

            if (json.data?.pokemon_v2_ability) {
                json.data.pokemon_v2_ability.forEach((a: GQLAbility) => {
                    let fr = a.name;
                    let en = a.name;

                    a.pokemon_v2_abilitynames.forEach((n) => {
                        if (n.language_id === 5) fr = n.name;
                        if (n.language_id === 9) en = n.name;
                    });
                    map.set(a.id, { fr, en });
                });
            }
            return map;
        } catch (e) {
            console.error("❌ Erreur GraphQL Abilities", e);
            return new Map();
        }
    },

    async fetchAllPokemonVariants(): Promise<GQLPokemonVariant[]> {
        const query = `
            query {
                pokemon_v2_pokemon(order_by: {id: asc}) {
                    id
                    name
                    pokemon_species_id
                    pokemon_v2_pokemontypes {
                        pokemon_v2_type {
                            name
                        }
                    }
                    pokemon_v2_pokemonabilities {
                        pokemon_v2_ability {
                            id
                        }
                    }
                }
            }
        `;
        try {
            const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const json = await res.json();
            return (json.data?.pokemon_v2_pokemon as GQLPokemonVariant[]) || [];
        } catch { return []; }
    },

    async getAllPokemonLiteFallback(): Promise<PokemonLite[]> {
        const response = await fetch(`${BASE_URL}/pokemon?limit=2000`);
        const data = await response.json();
        
        // Typage du résultat brut de "results"
        return data.results.map((p: { name: string; url: string }) => {
            const id = Number(p.url.split('/').slice(-2, -1)[0]);
            return {
                id: id,
                name: p.name,
                nameEn: p.name,
                url: p.url,
                types: [],
                abilities: { fr: [], en: [] }
            };
        });
    },
    // #endregion

    // #region 4. DÉTAILS COMPLETS (MODALE)
    // ------------------------------------------------------------------------
    async getPokemonDetails(id: number): Promise<Pokemon> {
        if (pokemonCache.has(id)) return pokemonCache.get(id)!;

        const pokemonRes = await fetch(`${BASE_URL}/pokemon/${id}`);
        if (!pokemonRes.ok) throw new Error(`Pokemon ${id} not found`);
        const data = await pokemonRes.json() as ApiPokemon; // Cast vers Interface

        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json() as ApiSpecies; // Cast vers Interface

        // Noms
        let nameFr = speciesData.names.find(n => n.language.name === 'fr')?.name || data.name;
        const technicalName = data.name.toLowerCase();

        if (technicalName.includes('-mega-x')) nameFr = `Méga-${nameFr} X`;
        else if (technicalName.includes('-mega-y')) nameFr = `Méga-${nameFr} Y`;
        else if (technicalName.includes('-mega')) nameFr = `Méga-${nameFr}`;
        else if (technicalName.includes('-gmax')) nameFr = `${nameFr} Gigamax`;
        else if (technicalName.includes('-alola')) nameFr = `${nameFr} d'Alola`;
        else if (technicalName.includes('-galar')) nameFr = `${nameFr} de Galar`;
        else if (technicalName.includes('-hisui')) nameFr = `${nameFr} d'Hisui`;
        else if (technicalName.includes('-paldea')) nameFr = `${nameFr} de Paldea`;
        else if (technicalName.includes('-primal')) nameFr = `${nameFr} Primo`;

        let nameEn = data.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        const getDesc = (lang: string) => speciesData.flavor_text_entries.find(f => f.language.name === lang)?.flavor_text?.replaceAll(/[\n\f]/g, ' ') || "Description non disponible.";

        const pokemonFull: Pokemon = {
            id: data.id,
            name: { en: nameEn, fr: nameFr },
            types: data.types.map(t => t.type.name as PokemonType),
            stats: {
                hp: data.stats[0].base_stat,
                attack: data.stats[1].base_stat,
                defense: data.stats[2].base_stat,
                specialAttack: data.stats[3].base_stat,
                specialDefense: data.stats[4].base_stat,
                speed: data.stats[5].base_stat,
            },
            moves: data.moves ? data.moves.map(m => ({ name: m.move.name, url: m.move.url })) : [],
            abilities: data.abilities.map(a => a.ability.name),
            generation: (speciesData.generation?.name || "generation-i").split('-')[1].toUpperCase(),
            region: I18n.translateRegion((speciesData.generation?.name || "generation-i").split('-')[1].toUpperCase()),
            height: data.height,
            weight: data.weight,
            evolutionUrl: speciesData.evolution_chain?.url || "",
            description: { fr: getDesc('fr'), en: getDesc('en') },
            sprites: {
                front_default: data.sprites.front_default,
                other: { 'official-artwork': { front_default: data.sprites.other?.['official-artwork']?.front_default || null } }
            }
        };

        pokemonCache.set(id, pokemonFull);
        return pokemonFull;
    },
    // #endregion

    // #region 5. UTILITAIRES DIVERS
    // ------------------------------------------------------------------------
    
    async getMoveDetails(url: string): Promise<MoveLite> {
        try {
            const res = await fetch(url);
            const data = await res.json() as ApiMove;
            const nameFr = data.names.find(n => n.language.name === 'fr')?.name || data.name;
            return {
                name: nameFr,
                url: url,
                type: data.type.name,
                power: data.power,
                accuracy: data.accuracy,
                pp: data.pp
            };
        } catch { return { name: "Erreur", url: url }; }
    },

    async getAbilityTranslation(abilityName: string, lang: 'fr' | 'en'): Promise<string> {
        const cacheKey = `${abilityName}-${lang}`;
        if (abilityCache.has(cacheKey)) return abilityCache.get(cacheKey)!;
        try {
            const res = await fetch(`${BASE_URL}/ability/${abilityName}`);
            // TODO : faire les détails de abilities
            const data = await res.json() as { names: ApiName[], name: string };
            
            const translation = data.names.find(n => n.language.name === lang);
            const result = translation ? translation.name : abilityName;
            abilityCache.set(cacheKey, result);
            return result;
        } catch { return abilityName; }
    },

    async getTypeRelations(type: string): Promise<any>{
        if (typeCache.has(type)) return typeCache.get(type);
        try {
            const res = await fetch(`${BASE_URL}/type/${type}`);
            const data = await res.json();
            typeCache.set(type, data.damage_relations);
            return data.damage_relations;
        } catch { return null; }
    },

    async getEvolutionChain(url: string): Promise<EvolutionNode> {
        if (!url) throw new Error("URL manquante");
        const response = await fetch(url);
        const data = await response.json() as ApiEvolutionChain;

        const buildChain = (chainData: ApiChainLink): EvolutionNode => {
            const id = Number(chainData.species.url.split('/').slice(-2, -1)[0]);
            return {
                name: chainData.species.name,
                id: id,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
                evolvesTo: chainData.evolves_to.map((evo) => buildChain(evo))
            };
        };
        return buildChain(data.chain);
    },

    async getTypesList(): Promise<string[]> {
        try {
            const res = await fetch(`${BASE_URL}/type`);
            const data = await res.json();
            return data.results
                .map((t: { name: string }) => t.name)
                .filter((t: string) => !['unknown', 'shadow', 'stellar'].includes(t));
        } catch { return ['normal', 'fire', 'water', 'grass']; }
    },

    async getGenerationsList(): Promise<string[]> {
        try {
            const res = await fetch(`${BASE_URL}/generation`);
            const data = await res.json();
            return data.results.map((g: { name: string }) => g.name.split('-')[1].toUpperCase());
        } catch { return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']; }
    },

    async getIdsByType(type: string): Promise<number[]> {
        if (type === 'all') return [];
        const res = await fetch(`${BASE_URL}/type/${type}`);
        const data = await res.json();
        return data.pokemon.map((p: { pokemon: { url: string } }) => Number(p.pokemon.url.split('/').slice(-2, -1)[0]));
    },

    async getIdsByGen(gen: string): Promise<number[]> {
        if (gen === 'all') return [];
        let query = gen.toLowerCase().startsWith('generation-') ? gen.toLowerCase() : `generation-${gen.toLowerCase()}`;
        const res = await fetch(`${BASE_URL}/generation/${query}`);
        const data = await res.json();
        return data.pokemon_species.map((p: { url: string }) => Number(p.url.split('/').slice(-2, -1)[0]));
    }
    // #endregion
};