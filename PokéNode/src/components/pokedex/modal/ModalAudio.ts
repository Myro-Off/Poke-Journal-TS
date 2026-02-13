import type { Pokemon, ImageMode } from '../../../types/model';

export class ModalAudio {

    // #region EFFETS SONORES UI
    // ============================================================================
    static playPaperSound(): void {
        try {
            const audio = new Audio('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg');
            audio.volume = 0.0;
        } catch (e) { }
    }
    // #endregion

    // #region GESTION DES CRIS
    // ============================================================================
    static setupCry(pokemon: Pokemon, mode: ImageMode): void {
        const btn = document.getElementById('play-cry') as HTMLButtonElement;
        if (!btn) return;

        this.setButtonLoading(btn);

        const { primary, fallback } = this.getCryUrls(pokemon.id, mode);
        this.loadAudioChain(btn, primary, fallback);
    }
    // #endregion

    // #region LOGIQUE DE CHARGEMENT
    // ============================================================================
    private static loadAudioChain(btn: HTMLButtonElement, url: string, fallbackUrl: string | null) {
        const audio = new Audio(url);
        audio.volume = 0.5;

        audio.oncanplaythrough = () => this.enableButton(btn, audio);
        
        audio.onerror = () => {
            if (fallbackUrl) {
                this.loadAudioChain(btn, fallbackUrl, null);
            } else {
                this.disableButton(btn);
            }
        };
    }

    private static getCryUrls(id: number, mode: ImageMode): { primary: string, fallback: string } {
        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon';
        const isLegacy = mode === 'legacy';

        return {
            primary: isLegacy ? `${baseUrl}/legacy/${id}.ogg` : `${baseUrl}/latest/${id}.ogg`,
            fallback: isLegacy ? `${baseUrl}/latest/${id}.ogg` : `${baseUrl}/legacy/${id}.ogg`
        };
    }
    // #endregion

    // #region GESTION UI BOUTON
    // ============================================================================
    private static setButtonLoading(btn: HTMLButtonElement) {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "wait";
    }

    private static enableButton(btn: HTMLButtonElement, audio: HTMLAudioElement) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";

        btn.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            
            btn.classList.remove('is-playing');
            void btn.offsetWidth; 
            btn.classList.add('is-playing');

            audio.currentTime = 0;
            audio.play().catch(console.error);
        };

        audio.onended = () => btn.classList.remove('is-playing');
    }

    private static disableButton(btn: HTMLButtonElement) {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "default";
        
        const label = btn.querySelector('.cry-label');
        if (label) label.textContent = "Muet";
    }
    // #endregion
}