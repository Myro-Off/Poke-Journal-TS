import './assets/style.css';
import { PokedexController } from './core/PokedexController';
import { TeamService } from './services/TeamService';

TeamService.init();

new PokedexController();
