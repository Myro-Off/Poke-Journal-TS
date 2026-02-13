import './assets/style.css';
import { PokedexController } from './core/PokedexController';

// #region POINT D'ENTRÉE (MAIN)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Instanciation du Contrôleur Principal
    new PokedexController();

});
// #endregion