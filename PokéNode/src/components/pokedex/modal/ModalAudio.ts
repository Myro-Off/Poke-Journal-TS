import type { Pokemon, ImageMode } from '../../../types/model';

export const ModalAudio = {

    playPaperSound(): void {
        try {
            // Son muet par défaut ou à remplacer par une vraie URL
            const audio = new Audio('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg');
            audio.volume = 0.0;
        } catch (e) { }
    },

    setupCry(pokemon: Pokemon, mode: ImageMode): void {
        // On récupère le bouton qui a été créé par ModalTemplates.ts
        const btn = document.getElementById('play-cry') as HTMLButtonElement;

        // Sécurité : si le bouton n'existe pas, on arrête tout
        if (!btn) return;

        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon';
        const primaryUrl = mode === 'legacy' ? `${baseUrl}/legacy/${pokemon.id}.ogg` : `${baseUrl}/latest/${pokemon.id}.ogg`;
        const fallbackUrl = mode === 'legacy' ? `${baseUrl}/latest/${pokemon.id}.ogg` : `${baseUrl}/legacy/${pokemon.id}.ogg`;

        // Logique de chargement
        const loadAudio = (url: string, isRetry: boolean = false) => {
            const audio = new Audio(url);
            audio.volume = 0.5;

            audio.oncanplaythrough = () => {
                // Le son est prêt : on active le bouton
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";

                btn.onclick = (e) => {
                    e.stopPropagation();
                    btn.classList.remove('is-playing');
                    void btn.offsetWidth; // Reset animation CSS
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
                    // Échec total
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                    btn.style.cursor = "default";
                    const label = btn.querySelector('.cry-label');
                    if (label) label.textContent = "Muet";
                }
            };
        };

        // État initial (Chargement...)
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "wait";

        loadAudio(primaryUrl);
    }
};
