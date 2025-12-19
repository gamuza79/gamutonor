export class Generator {
    static generateLevel(mode, difficulty) {
        if (mode === 'ultra') {
            return this.generateUltra();
        } else {
            return this.generateStandard(difficulty);
        }
    }

    static generateStandard(count) {
        // Standard Logic: Only Sum and Product
        // Strictly pairs of (Sum, Product)
        // count is usually 4, 6, or 8.

        const strip = [];
        for (let i = 0; i < count; i++) {
            strip.push(Math.floor(Math.random() * 9) + 1);
        }

        const pool = [...strip];
        this.shuffleArray(pool);

        let targetIdCounter = 0;
        const targets = [];
        const numPairs = count / 2;

        // Exact Split: Half Sums, Half Products
        // E.g. 4 items -> 2 pairs -> 1 Sum, 1 Product
        // E.g. 8 items -> 4 pairs -> 2 Sums, 2 Products

        let sumCount = Math.ceil(numPairs / 2); // Bias to sum if odd pairs? Usually pairs are even.

        for (let i = 0; i < numPairs; i++) {
            const p1 = pool.pop();
            const p2 = pool.pop();
            const pair = [p1, p2].sort((a, b) => a - b);

            // Alternating or Random split? Standard Tetonor was mixed.
            // Let's enforce the split.
            const type = (i < sumCount) ? 'sum' : 'product';
            const value = (type === 'sum') ? (pair[0] + pair[1]) : (pair[0] * pair[1]);

            targets.push({
                id: `g-${targetIdCounter++}`,
                value: value,
                type: type,
                parents: pair,
                solved: false,
                solvedIndices: null
            });
        }

        return { strip, targets };
    }

    static generateUltra() {
        const count = 16;
        const strip = [];
        for (let i = 0; i < count; i++) {
            strip.push(Math.floor(Math.random() * 9) + 1);
        }

        const pool = [...strip];
        this.shuffleArray(pool);

        let targetIdCounter = 0;
        const targets = [];
        const numPairs = count / 2; // 8 pairs

        for (let i = 0; i < numPairs; i++) {
            const p1 = pool.pop();
            const p2 = pool.pop();
            const pair = [p1, p2].sort((a, b) => a - b);

            // Logic: Randomly pick valid operation
            // Must check Division validity
            const validOps = ['sum', 'product', 'diff'];
            if (pair[0] !== 0 && pair[1] % pair[0] === 0) validOps.push('div');

            const opType = validOps[Math.floor(Math.random() * validOps.length)];

            let value;
            if (opType === 'sum') value = pair[0] + pair[1];
            else if (opType === 'product') value = pair[0] * pair[1];
            else if (opType === 'diff') value = pair[1] - pair[0];
            else if (opType === 'div') value = pair[1] / pair[0];

            targets.push({
                id: `g-${targetIdCounter++}`,
                value: value,
                type: opType,
                parents: pair,
                solved: false,
                solvedIndices: null
            });
        }

        return { strip, targets };
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
