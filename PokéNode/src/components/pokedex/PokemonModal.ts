import type { Pokemon, ImageMode, EvolutionNode, Language } from '../../types/model';
import { PokemonAPI } from '../../core/api';
import { ModalTemplates } from './modal/ModalTemplates';
import { ModalAudio } from './modal/ModalAudio';
import { I18n } from '../../services/I18n';

export class PokeModal extends HTMLElement {

    // @ts-ignore
    static get observedAttributes() { return ['lang', 'mode', 'open']; }

    private currentList: Pokemon[] = [];
    private currentIndex: number = -1;
    private _pokemon: Pokemon | null = null;
    private _evolution: EvolutionNode | null = null;

    // @ts-ignore
    connectedCallback() {
        if (!this.querySelector('.modal-content')) {
            this.renderBase();
            this.attachGlobalEvents();
        }
    }

    // @ts-ignore
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            if (newValue === 'true') {
                document.body.style.overflow = 'hidden';
                ModalAudio.playPaperSound();
            } else {
                document.body.style.overflow = '';
            }
        }

        if (name === 'lang' || name === 'mode') {
            this.syncCheckboxes();
            // On re-rend uniquement si ouvert
            if (this.getAttribute('open') === 'true' && this._pokemon) {
                this.renderContent();
                this.fetchEnrichments(this._pokemon);
            }
        }
    }

    public open(pokemon: Pokemon) {
        this._pokemon = pokemon;
        this._evolution = null;
        this.currentIndex = this.currentList.findIndex(p => p.id === pokemon.id);
        this.setAttribute('open', 'true');
        this.renderContent();
        this.fetchEnrichments(pokemon);
    }

    public close() {
        this.setAttribute('open', 'false');
    }

    set contextList(list: Pokemon[]) {
        this.currentList = list;
    }

    private get currentLang(): Language {
        return (this.getAttribute('lang') as Language) || 'fr';
    }

    private get currentMode(): ImageMode {
        return (this.getAttribute('mode') as ImageMode) || 'artwork';
    }

    private renderBase() {
        this.innerHTML = ModalTemplates.getBaseHTML(this.currentLang, this.currentMode);
    }

    private renderContent() {
        if (!this._pokemon) return;
        const modalBody = this.querySelector('#modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = ModalTemplates.getPokemonContentHTML(
            this._pokemon,
            this.currentMode,
            this.currentLang,
            this._evolution
        );

        ModalAudio.setupCry(this._pokemon, this.currentMode);
        if (this._evolution) this.attachEvoClicks();
    }

    private syncCheckboxes() {
        const langIn = this.querySelector('#modal-toggle-lang') as HTMLInputElement;
        const modeIn = this.querySelector('#modal-toggle-mode') as HTMLInputElement;
        if (langIn) langIn.checked = (this.currentLang === 'en');
        if (modeIn) modeIn.checked = (this.currentMode === 'legacy');
    }

    private async fetchEnrichments(pokemon: Pokemon) {
        try {
            const [translatedAbilities, typeRelationsList] = await Promise.all([
                Promise.all(pokemon.abilities.map(a => PokemonAPI.getAbilityTranslation(a, this.currentLang))),
                Promise.all(pokemon.types.map(t => PokemonAPI.getTypeRelations(t)))
            ]);

            if (this._pokemon?.id !== pokemon.id) return;

            this._pokemon = { ...pokemon, abilities: translatedAbilities };
            const metaVal = this.querySelector('.meta-value-abilities');
            if (metaVal) metaVal.textContent = translatedAbilities.join(', ');

            const htmls = ModalTemplates.getEfficaciesHTML(typeRelationsList);
            const weakList = this.querySelector('#modal-weak-list');
            const resistList = this.querySelector('#modal-resist-list');
            if (weakList) weakList.innerHTML = htmls.weak;
            if (resistList) resistList.innerHTML = htmls.resist;

            const chain = await PokemonAPI.getEvolutionChain(pokemon.evolutionUrl);
            await this.translateEvoTree(chain);

            if (this._pokemon?.id === pokemon.id) {
                this._evolution = chain;
                const evoContainer = this.querySelector('#modal-evo-content');
                if (evoContainer) {
                    evoContainer.innerHTML = `
                        <div class="evo-tree-container" style="display:flex; justify-content:center; overflow-x:auto; padding:10px;">
                            ${ModalTemplates.buildEvolutionHTML(chain, this.currentMode)}
                        </div>`;
                    this.attachEvoClicks();
                }
            }
        } catch (e) { console.error(e); }
    }

    private async translateEvoTree(node: EvolutionNode): Promise<void> {
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${node.id}`);
            const data = await res.json();
            const name = data.names.find((n: any) => n.language.name === this.currentLang)?.name;
            if (name) node.name = name;
        } catch { }
        if (node.evolvesTo?.length > 0) {
            await Promise.all(node.evolvesTo.map(child => this.translateEvoTree(child)));
        }
    }

    private attachGlobalEvents() {
        this.addEventListener('click', (e) => {
            if (e.target === this) {
                this.close();
            }
        });

        this.querySelector('#close-modal')?.addEventListener('click', () => this.close());
        this.querySelector('#prev-pokemon')?.addEventListener('click', () => this.navigate(-1));
        this.querySelector('#next-pokemon')?.addEventListener('click', () => this.navigate(1));

        const toggleHandler = () => {
            const langIn = this.querySelector('#modal-toggle-lang') as HTMLInputElement;
            const modeIn = this.querySelector('#modal-toggle-mode') as HTMLInputElement;

            const newLang: Language = langIn.checked ? 'en' : 'fr';
            const newMode: ImageMode = modeIn.checked ? 'legacy' : 'artwork';

            I18n.currentLang = newLang;

            this.setAttribute('lang', newLang);
            this.setAttribute('mode', newMode);

            this.dispatchEvent(new CustomEvent('settings-change', {
                detail: { lang: newLang, mode: newMode },
                bubbles: true
            }));
        };

        this.querySelector('#modal-toggle-lang')?.addEventListener('change', toggleHandler);
        this.querySelector('#modal-toggle-mode')?.addEventListener('change', toggleHandler);

        globalThis.addEventListener('keydown', (e) => {
            if (this.getAttribute('open') === 'true') {
                e.stopPropagation();

                if (e.key === 'Escape') this.close();
                if (e.key === 'ArrowLeft') this.navigate(-1);
                if (e.key === 'ArrowRight') this.navigate(1);
            }
        });
    }

    private attachEvoClicks() {
        this.querySelectorAll('.clickable-evo').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number((e.currentTarget as HTMLElement).dataset.id);
                const next = this.currentList.find(p => p.id === id);
                if (next) this.open(next);
                else PokemonAPI.getPokemonDetails(id).then(p => this.open(p));
            });
        });
    }

    private navigate(dir: number) {
        if (this.currentList.length === 0) return;
        let newIdx = this.currentIndex + dir;
        if (newIdx < 0) newIdx = this.currentList.length - 1;
        if (newIdx >= this.currentList.length) newIdx = 0;
        this.open(this.currentList[newIdx]);
    }
}

customElements.define('poke-modal', PokeModal);
