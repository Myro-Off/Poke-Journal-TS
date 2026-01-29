import type { Pokemon, ImageMode } from '../../../types/model';

export const ModalAudio = {

    // #region EFFETS SONORES UI
    // ============================================================================
    // permet de jouer le son quand on vient d'ouvrir un modal sans y avoir touché pour certains navigateurs
    playPaperSound(): void {
        try {
            const audio = new Audio('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg');
            audio.volume = 0.0;
        } catch (e) { }
    },
    // #endregion

    // #region GESTION DES CRIS
    // ============================================================================
    setupCry(pokemon: Pokemon, mode: ImageMode): void {
        const btn = document.getElementById('play-cry') as HTMLButtonElement;
        if (!btn) return;

        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon';
        const primaryUrl = mode === 'legacy' ? `${baseUrl}/legacy/${pokemon.id}.ogg` : `${baseUrl}/latest/${pokemon.id}.ogg`;
        const fallbackUrl = mode === 'legacy' ? `${baseUrl}/latest/${pokemon.id}.ogg` : `${baseUrl}/legacy/${pokemon.id}.ogg`;

        const loadAudio = (url: string, isRetry: boolean = false) => {
            const audio = new Audio(url);
            audio.volume = 0.5;

            audio.oncanplaythrough = () => {
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
            };

            audio.onerror = () => {
                if (!isRetry) {
                    loadAudio(fallbackUrl, true);
                } else {
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                    btn.style.cursor = "default";
                    const label = btn.querySelector('.cry-label');
                    if (label) label.textContent = "Muet";
                }
            };
        };

        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "wait";

        loadAudio(primaryUrl);
    }
    // #endregion
};