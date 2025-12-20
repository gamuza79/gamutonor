import { TetonorGame } from './core/Game.js';

document.addEventListener('DOMContentLoaded', () => {
    window.game = new TetonorGame();
    window.game.init();
});
