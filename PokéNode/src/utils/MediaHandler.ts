import type { ImageMode } from '../types/model';
import PLACEHOLDER_HD from '../assets/unknown-hd.png';

const PLACEHOLDER_PIXEL = 'https://www.icons101.com/icon_ico/id_60220/201_Unown__.ico';

export class MediaHandler {

    // #region CONFIGURATION & EXCEPTIONS
    // ============================================================================
    private static readonly CUSTOM_IMAGES: Record<number, { artwork?: string; legacy?: string }> = {
        10319: { // Zeraora (Custom Sprite)
            legacy: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e57c0ca5-c162-43e7-b0dc-40f215c30321/dkxznvc-efc473a4-95d9-481c-903c-ef69254c79ae.gif/v1/fill/w_480,h_480/mega_zeraora_gen_5_pokemon_sprite_by_retronc_dkxznvc-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NDgwIiwicGF0aCI6Ii9mL2U1N2MwY2E1LWMxNjItNDNlNy1iMGRjLTQwZjIxNWMzMDMyMS9ka3h6bnZjLWVmYzQ3M2E0LTk1ZDktNDgxYy05MDNjLWVmNjkyNTRjNzlhZS5naWYiLCJ3aWR0aCI6Ijw9NDgwIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.n5iYxBtd6D6BvHcdx1J0du0t03q8Ik_TVsYiObXd05w'
        },
        10322: { artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10324.png' },
        10323: { artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10324.png' },
        10318: { artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10317.png' },
        10309: { artwork: 'https://www.pokepedia.fr/images/thumb/4/43/M%C3%A9ga-Carchacrok-XY.png/800px-M%C3%A9ga-Carchacrok-XY.png' },
    };
    // #endregion

    // #region API PUBLIQUE
    // ============================================================================
    static getCardImage(pokemon: { id: number }, mode: ImageMode): string {
        if (!pokemon.id || pokemon.id <= 0) {
            return this.getPlaceholder(mode);
        }

        const custom = this.CUSTOM_IMAGES[pokemon.id];
        if (custom && custom[mode]) {
            return custom[mode]!;
        }

        return this.buildDirectUrl(pokemon.id, mode);
    }

    static getModalImage(pokemon: { id: number }, mode: ImageMode): string {
        return this.getCardImage(pokemon, mode);
    }

    static getPlaceholder(mode: ImageMode): string {
        return mode === 'legacy' ? PLACEHOLDER_PIXEL : PLACEHOLDER_HD;
    }
    // #endregion

    // #region UTILITAIRES INTERNES
    // ============================================================================
    private static buildDirectUrl(id: number, mode: ImageMode): string {
        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

        if (mode === 'legacy') {
            return `${baseUrl}/${id}.png`;
        }
        
        return `${baseUrl}/other/official-artwork/${id}.png`;
    }
    // #endregion
}