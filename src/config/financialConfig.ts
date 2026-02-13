export interface ManualCost {
    id: string;
    description: string;
    category: string;
    active: boolean;
    getAmount: (date: Date) => number;
    dueDateDay: number;
    paidMonths: string[]; // Format 'YYYY-MM'
}

export const financialConfig = {
    initialCashBalance: 43254.01,
    referenceDate: '2026-02-12', // Data de referência do saldo

    manualFixedCosts: [
        {
            id: 'prolabore-douglas',
            description: 'Pro-labore Douglas Lopes',
            category: 'Pessoal',
            active: true,
            dueDateDay: 10,
            paidMonths: ['2026-02'], // Pago em Fev
            getAmount: (date: Date) => {
                const month = date.getMonth(); // 0-11. Feb = 1.
                const year = date.getFullYear();
                // Starts Feb 2026
                if (year < 2026 || (year === 2026 && month < 1)) return 0;

                // Feb 2026: 3000
                if (year === 2026 && month === 1) return 3000;
                // Mar 2026 onwards: 2000
                return 2000;
            }
        },
        {
            id: 'prolabore-lucas',
            description: 'Pro-labore Lucas',
            category: 'Pessoal',
            active: true,
            dueDateDay: 10,
            paidMonths: ['2026-02'], // Pago em Fev
            getAmount: (date: Date) => {
                const month = date.getMonth();
                const year = date.getFullYear();
                // Starts Feb 2026
                if (year < 2026 || (year === 2026 && month < 1)) return 0;
                return 2000;
            }
        },
        {
            id: 'inss',
            description: 'INSS (11% Pro-labore)',
            category: 'Impostos',
            active: true,
            dueDateDay: 10,
            paidMonths: [], // Pendente em Fev
            getAmount: (date: Date) => {
                const month = date.getMonth();
                const year = date.getFullYear();
                if (year < 2026 || (year === 2026 && month < 1)) return 0;

                // Calculate base
                let base = 2000; // Lucas always 2000
                if (year === 2026 && month === 1) base += 3000; // Douglas Feb
                else base += 2000; // Douglas Mar+

                return base * 0.11;
            }
        },
        // Carlos Lucas: Conselheiro
        {
            id: 'prolabore-carlos',
            description: 'Pagamento Carlos Lucas (Conselheiro)',
            category: 'Pessoal',
            active: true,
            dueDateDay: 10,
            paidMonths: [], // Pendente em Fev
            getAmount: (date: Date) => {
                const month = date.getMonth();
                const year = date.getFullYear();
                if (year < 2026 || (year === 2026 && month < 1)) return 0;
                return 1000;
            }
        }
    ] as ManualCost[]
};
