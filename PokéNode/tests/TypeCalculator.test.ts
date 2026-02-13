import { describe, it, expect } from 'vitest';
import { TypeCalculator } from '../src/utils/TypeCalculator';

describe('TypeCalculator', () => {
    
    it('doit identifier les faiblesses simples (Plante vs Feu)', () => {
        // Un Pokémon Plante (Grass)
        const types = ['grass']; 
        
        const result = TypeCalculator.getWeaknesses(types as any);
        
        // On s'attend à ce que le feu soit une faiblesse x2
        const fireWeakness = result.weak.find(w => w.type === 'fire');
        
        expect(fireWeakness).toBeDefined();
        expect(fireWeakness?.value).toBe(2);
    });

    it('doit gérer les doubles faiblesses (Plante/Insecte vs Feu)', () => {
        // Paras (Plante / Insecte) brûle très bien (x4)
        const types = ['grass', 'bug']; 
        
        const result = TypeCalculator.getWeaknesses(types as any);
        
        const fireWeakness = result.weak.find(w => w.type === 'fire');
        expect(fireWeakness?.value).toBe(4);
    });

    it('doit gérer les immunités (Vol vs Sol)', () => {
        const types = ['flying'];
        const result = TypeCalculator.getWeaknesses(types as any);
        
        // Le sol ne doit pas être dans les faiblesses
        const groundWeakness = result.weak.find(w => w.type === 'ground');
        expect(groundWeakness).toBeUndefined();
    });
});