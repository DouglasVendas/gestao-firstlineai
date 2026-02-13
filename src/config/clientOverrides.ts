export interface ClientOverride {
    id?: string;
    nameMatch?: string;
    mrr?: number;
    periodicity?: 'monthly' | 'bi-monthly' | 'quarterly' | 'semestral' | 'annual' | 'annual_monthly_payment';
    status?: 'active' | 'churned';
    churnDate?: string;
    mergeWith?: string;
    ignore?: boolean;
    startDate?: string;
}

export const clientOverrides: ClientOverride[] = [
    // 1. Mosko Digital: Bimestral.
    { nameMatch: 'Mosko Digital', periodicity: 'bi-monthly' },

    // 2. Contratos Anuais com Pagamento Mensal (MRR = Valor da Parcela)
    { nameMatch: 'Rodrigo Avelar', periodicity: 'annual_monthly_payment' },
    { nameMatch: 'Vitória Pontin', periodicity: 'annual_monthly_payment' },
    { nameMatch: 'Felipe Campos', periodicity: 'annual_monthly_payment' },

    // 3. Churns em Fevereiro
    { nameMatch: 'Virtux Tech', status: 'churned', churnDate: '2026-02-01' },
    { nameMatch: 'Alisson Gonçalves', status: 'churned', churnDate: '2026-02-01' },

    // 4. Duplicate Handling
    { nameMatch: 'JULIANA da silva ANHAIA', ignore: true }, // Keep 'Juliana Anhaia'

    // 5. Contratos Longos com Pagamento Único (Divide pelo período)
    { nameMatch: 'FÁBIO COSTA', periodicity: 'annual' }, // R$ 3.564 / 12
    { nameMatch: 'Fabiano Brino', periodicity: 'quarterly' }, // R$ 997 / 3

    // 6. Mensais Confirmados
    { nameMatch: 'Guilherme Costa', periodicity: 'monthly' },
    { nameMatch: 'BFR Assessor', periodicity: 'monthly' },
    { nameMatch: 'Daiane Dalavi', periodicity: 'monthly' },
    { nameMatch: 'DENER MARQUES', periodicity: 'monthly' },

    // 7. Mais Contratos Anuais com Pagamento Mensal
    { nameMatch: 'Comunicação Asas', periodicity: 'annual_monthly_payment' },
    { nameMatch: 'Elaine Ferreira', periodicity: 'annual_monthly_payment' },
];
