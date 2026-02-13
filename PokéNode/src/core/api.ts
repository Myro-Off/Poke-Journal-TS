import type { Pokemon, PokemonType, EvolutionNode, PokemonLite, MoveLite } from '../types/model';
import { I18n } from '../services/I18n';

// #region INTERFACES API (INTERNE)
// ============================================================================
interface GQLName { name: string; language_id: number; }
interface GQLSpecies { id: number; name: string; pokemon_v2_pokemonspeciesnames: GQLName[]; }
interface GQLAbility { id: number; name: string; pokemon_v2_abilitynames: GQLName[]; }
interface GQLMove { name: string; pokemon_v2_movenames: GQLName[]; }
interface GQLPokemonVariant {
    id: number;
    name: string;
    pokemon_species_id: number;
    pokemon_v2_pokemontypes: { pokemon_v2_type: { name: string } }[];
    pokemon_v2_pokemonabilities: { pokemon_v2_ability: { id: number } }[];
}

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
    damage_class: { name: string };
    flavor_text_entries: ApiFlavorText[];
}
// #endregion

// #region CONFIGURATION & CACHE
// ============================================================================
const BASE_URL = 'https://pokeapi.co/api/v2';
const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';

const pokemonCache = new Map<number, Pokemon>();
const typeCache = new Map<string, unknown>(); 
const abilityCache = new Map<string, string>();
const moveNameCache = new Map<string, { fr: string, en: string }>();

let _globalLiteCache: PokemonLite[] = [];
// #endregion

export class PokemonAPI {

    // #region GESTION DU CACHE
    // ============================================================================
    static getCachedPokemon(id: number): Pokemon | undefined {
        return pokemonCache.get(id);
    }

    static getMoveName(technicalName: string): { fr: string, en: string } {
        const cached = moveNameCache.get(technicalName);
        if (cached) return cached;
        const formatted = technicalName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return { fr: formatted, en: formatted };
    }
    // #endregion

    // #region LISTING GLOBAL (POKÉDEX LITE)
    // ============================================================================
    static async getAllPokemonLite(): Promise<PokemonLite[]> {
        if (_globalLiteCache.length > 0) return _globalLiteCache;

        try {
            const [speciesMap, abilitiesMap, _] = await Promise.all([
                this.fetchAllSpeciesNames(),
                this.fetchAllAbilityNames(),
                this.fetchAllMoveNames()
            ]);

            const variants = await this.fetchAllPokemonVariants();

            _globalLiteCache = variants.map((v) => this.mapVariantToLite(v, speciesMap, abilitiesMap));
            return _globalLiteCache;

        } catch (e) {
            console.warn("⚠️ Échec stratégie Split Query, passage en mode secours (REST).", e);
            return this.getAllPokemonLiteFallback();
        }
    }

    private static mapVariantToLite(
        p: GQLPokemonVariant, 
        speciesMap: Map<number, string>, 
        abilitiesMap: Map<number, { fr: string, en: string }>
    ): PokemonLite {
        const speciesNameFr = speciesMap.get(p.pokemon_species_id) || p.name;
        
        const techName = p.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        const finalNameFr = this.formatVariantName(p.name, speciesNameFr);

        const types = p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name);

        const abilitiesFr: string[] = [];
        const abilitiesEn: string[] = [];

        p.pokemon_v2_pokemonabilities.forEach(pa => {
            const names = abilitiesMap.get(pa.pokemon_v2_ability.id);
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
    }

    private static formatVariantName(rawName: string, speciesNameFr: string): string {
        let finalName = speciesNameFr;
        const lowerRaw = rawName.toLowerCase();
        const lowerSpecies = speciesNameFr.toLowerCase();

        if (!lowerRaw.includes(lowerSpecies) && rawName.includes('-')) {
            if (rawName.includes('-mega-x')) finalName = `Méga-${speciesNameFr} X`;
            else if (rawName.includes('-mega-y')) finalName = `Méga-${speciesNameFr} Y`;
            else if (rawName.includes('-mega')) finalName = `Méga-${speciesNameFr}`;
            else if (rawName.includes('-gmax')) finalName = `${speciesNameFr} Gigamax`;
            else if (rawName.includes('-alola')) finalName = `${speciesNameFr} d'Alola`;
            else if (rawName.includes('-galar')) finalName = `${speciesNameFr} de Galar`;
            else if (rawName.includes('-hisui')) finalName = `${speciesNameFr} d'Hisui`;
            else if (rawName.includes('-paldea')) finalName = `${speciesNameFr} de Paldea`;
            else if (rawName.includes('-primal')) finalName = `Primo-${speciesNameFr}`;
        }
        
        return finalName.charAt(0).toUpperCase() + finalName.slice(1);
    }
    // #endregion

    // #region REQUÊTES GRAPHQL (HELPERS)
    // ============================================================================
    static async fetchAllSpeciesNames(): Promise<Map<number, string>> {
        const query = `query { pokemon_v2_pokemonspecies(order_by: {id: asc}) { id name pokemon_v2_pokemonspeciesnames(where: {language_id: {_eq: 5}}) { name } } }`;
        try {
            const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query}) });
            const json = await res.json();
            const map = new Map<number, string>();
            if (json.data?.pokemon_v2_pokemonspecies) {
                json.data.pokemon_v2_pokemonspecies.forEach((s: GQLSpecies) => {
                    const name = s.pokemon_v2_pokemonspeciesnames[0]?.name || s.name;
                    map.set(s.id, name);
                });
            }
            return map;
        } catch { return new Map(); }
    }

    static async fetchAllAbilityNames(): Promise<Map<number, { fr: string, en: string }>> {
        const query = `query { pokemon_v2_ability { id name pokemon_v2_abilitynames(where: {language_id: {_in: [5, 9]}}) { name language_id } } }`;
        try {
            const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const json = await res.json();
            const map = new Map<number, { fr: string, en: string }>();
            if (json.data?.pokemon_v2_ability) {
                json.data.pokemon_v2_ability.forEach((a: GQLAbility) => {
                    let fr = a.name; let en = a.name;
                    a.pokemon_v2_abilitynames.forEach((n) => {
                        if (n.language_id === 5) fr = n.name;
                        if (n.language_id === 9) en = n.name;
                    });
                    map.set(a.id, { fr, en });
                });
            }
            return map;
        } catch { return new Map(); }
    }

    static async fetchAllMoveNames(): Promise<void> {
        const query = `query { pokemon_v2_move { name pokemon_v2_movenames(where: {language_id: {_in: [5, 9]}}) { name language_id } } }`;
        try {
            const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const json = await res.json();
            if (json.data?.pokemon_v2_move) {
                json.data.pokemon_v2_move.forEach((m: GQLMove) => {
                    let fr = m.name; let en = m.name;
                    m.pokemon_v2_movenames.forEach((n) => {
                        if (n.language_id === 5) fr = n.name;
                        if (n.language_id === 9) en = n.name;
                    });
                    if (en === m.name) {
                        en = en.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    }
                    moveNameCache.set(m.name, { fr, en });
                });
            }
        } catch (e) { console.error("Erreur Move Names", e); }
    }

    static async fetchAllPokemonVariants(): Promise<GQLPokemonVariant[]> {
        const query = `query { pokemon_v2_pokemon(order_by: {id: asc}) { id name pokemon_species_id pokemon_v2_pokemontypes { pokemon_v2_type { name } } pokemon_v2_pokemonabilities { pokemon_v2_ability { id } } } }`;
        try {
            const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const json = await res.json();
            return (json.data?.pokemon_v2_pokemon as GQLPokemonVariant[]) || [];
        } catch { return []; }
    }

    static async getAllPokemonLiteFallback(): Promise<PokemonLite[]> {
        const response = await fetch(`${BASE_URL}/pokemon?limit=2000`);
        const data = await response.json();
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
    }
    // #endregion

    // #region DÉTAILS POKÉMON (FULL)
    // ============================================================================
    static async getPokemonDetails(id: number): Promise<Pokemon> {
        if (pokemonCache.has(id)) return pokemonCache.get(id)!;

        const pokemonRes = await fetch(`${BASE_URL}/pokemon/${id}`);
        if (!pokemonRes.ok) throw new Error(`Pokemon ${id} not found`);
        const data = await pokemonRes.json() as ApiPokemon; 

        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json() as ApiSpecies; 

        const baseNameFr = speciesData.names.find(n => n.language.name === 'fr')?.name || data.name;
        const nameFr = this.formatVariantName(data.name, baseNameFr);
        const nameEn = data.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        const getDesc = (lang: string) => 
            speciesData.flavor_text_entries
                .find(f => f.language.name === lang)?.flavor_text?.replaceAll(/[\n\f]/g, ' ') 
                || "Description non disponible.";

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
    }
    // #endregion

    // #region DÉTAILS TECHNIQUES (MOVES, ABILITIES, TYPES)
    // ============================================================================
    static async getMoveDetails(url: string): Promise<MoveLite> {
        try {
            const res = await fetch(url);
            const data = await res.json() as ApiMove;
            
            const nameFr = data.names.find(n => n.language.name === 'fr')?.name || this.getMoveName(data.name).fr;
            const nameEn = data.names.find(n => n.language.name === 'en')?.name || this.getMoveName(data.name).en;

            const getDesc = (lang: string) => {
                const entry = data.flavor_text_entries.find(f => f.language.name === lang);
                if (!entry && lang !== 'en') {
                    return data.flavor_text_entries.find(f => f.language.name === 'en')?.flavor_text?.replace(/[\n\f]/g, ' ') || "No description.";
                }
                return entry?.flavor_text?.replace(/[\n\f]/g, ' ') || "Aucune description.";
            };

            return {
                name: { fr: nameFr, en: nameEn },
                url: url,
                type: data.type.name,
                power: data.power,
                accuracy: data.accuracy,
                pp: data.pp,
                category: data.damage_class?.name as 'physical' | 'special' | 'status',
                description: {
                    fr: getDesc('fr'),
                    en: getDesc('en')
                }
            };
        } catch (e) { 
            console.error("Erreur Move Details", e);
            return { name: "Erreur", url: url }; 
        }
    }

    static async getAbilityTranslation(abilityName: string, lang: 'fr' | 'en'): Promise<string> {
        const cacheKey = `${abilityName}-${lang}`;
        if (abilityCache.has(cacheKey)) return abilityCache.get(cacheKey)!;
        
        try {
            const res = await fetch(`${BASE_URL}/ability/${abilityName}`);
            const data = await res.json() as { names: ApiName[], name: string };
            const translation = data.names.find(n => n.language.name === lang);
            const result = translation ? translation.name : abilityName;
            
            abilityCache.set(cacheKey, result);
            return result;
        } catch { return abilityName; }
    }

    static async getTypeRelations(type: string): Promise<any>{
        if (typeCache.has(type)) return typeCache.get(type);
        try {
            const res = await fetch(`${BASE_URL}/type/${type}`);
            const data = await res.json();
            typeCache.set(type, data.damage_relations);
            return data.damage_relations;
        } catch { return null; }
    }
    // #endregion

    // #region ÉVOLUTIONS
    // ============================================================================
    static async getEvolutionChain(url: string): Promise<EvolutionNode> {
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
    }
    // #endregion

    // #region LISTES & FILTRES
    // ============================================================================
    static async getTypesList(): Promise<string[]> {
        try {
            const res = await fetch(`${BASE_URL}/type`);
            const data = await res.json();
            return data.results
                .map((t: { name: string }) => t.name)
                .filter((t: string) => !['unknown', 'shadow', 'stellar'].includes(t));
        } catch { 
            return ['normal', 'fire', 'water', 'grass']; 
        }
    }

    static async getGenerationsList(): Promise<string[]> {
        try {
            const res = await fetch(`${BASE_URL}/generation`);
            const data = await res.json();
            return data.results.map((g: { name: string }) => g.name.split('-')[1].toUpperCase());
        } catch { 
            return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']; 
        }
    }

    static async getIdsByType(type: string): Promise<number[]> {
        if (type === 'all') return [];
        const res = await fetch(`${BASE_URL}/type/${type}`);
        const data = await res.json();
        return data.pokemon.map((p: { pokemon: { url: string } }) => Number(p.pokemon.url.split('/').slice(-2, -1)[0]));
    }

    static async getIdsByGen(gen: string): Promise<number[]> {
        if (gen === 'all') return [];
        let query = gen.toLowerCase().startsWith('generation-') ? gen.toLowerCase() : `generation-${gen.toLowerCase()}`;
        const res = await fetch(`${BASE_URL}/generation/${query}`);
        const data = await res.json();
        return data.pokemon_species.map((p: { url: string }) => Number(p.url.split('/').slice(-2, -1)[0]));
    }
    // #endregion
}