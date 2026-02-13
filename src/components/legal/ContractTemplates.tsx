
export const CONTRACT_TEMPLATES = [
    {
        id: "saas-b2b",
        title: "Contrato de Licença de Software (SaaS)",
        description: "Contrato padrão para licenciamento de software como serviço para empresas.",
        content: `
CONTRATO DE LICENÇA DE USO DE SOFTWARE (SaaS)

IDENTIFICAÇÃO DAS PARTES

CONTRATADA: SAAS COMPASS TECNOLOGIA LTDA, inscrita no CNPJ sob o nº 00.000.000/0001-00, com sede em [Endereço da Empresa].

CONTRATANTE: {{CLIENT_NAME}}, inscrita no CNPJ sob o nº {{CLIENT_CNPJ}}, com sede em {{CLIENT_ADDRESS}}.

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Licença de Uso de Software, que se regerá pelas cláusulas seguintes:

1. DO OBJETO
1.1. O presente contrato tem por objeto a concessão de licença de uso, em caráter não exclusivo e intransferível, do software {{SOFTWARE_NAME}}, disponibilizado na modalidade SaaS (Software as a Service).

2. DO PLANO E VALORES
2.1. A CONTRATANTE opta pelo Plano {{PLAN_NAME}}, conforme proposta comercial aceita.
2.2. O valor mensal da assinatura é de R$ {{MONTHLY_VALUE}}, a ser pago via boleto bancário ou cartão de crédito.
2.3. O atraso no pagamento acarretará multa de 2% e juros de 1% ao mês.

3. DA VIGÊNCIA
3.1. O presente contrato entra em vigor em {{START_DATE}} e terá vigência de 12 (doze) meses, renovável automaticamente por iguais períodos.

4. DAS OBRIGAÇÕES DA CONTRATADA
4.1. Manter o software disponível 99,5% do tempo (SLA).
4.2. Prestar suporte técnico e atualizações corretivas.
4.3. Garantir a segurança e confidencialidade dos dados da CONTRATANTE.

5. DAS OBRIGAÇÕES DA CONTRATANTE
5.1. Utilizar o software de acordo com os Termos de Uso.
5.2. Efetuar os pagamentos nas datas acordadas.

6. CONFIDENCIALIDADE
6.1. As partes comprometem-se a manter em sigilo todas as informações confidenciais trocadas durante a vigência deste contrato.

7. CLÁUSULAS ESPECIAIS
{{SPECIAL_CLAUSES}}

8. DO FORO
8.1. Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas oriundas deste contrato.

E, por estarem assim justos e contratados, assinam o presente instrumento.

São Paulo, {{CURRENT_DATE}}.

__________________________________
SAAS COMPASS TECNOLOGIA LTDA

__________________________________
{{CLIENT_NAME}}
    `
    },
    {
        id: "nda",
        title: "Acordo de Confidencialidade (NDA)",
        description: "Proteger informações sensíveis trocadas com parceiros ou clientes.",
        content: `
ACORDO DE CONFIDENCIALIDADE (NDA)

PARTES:

REVELADORA: SAAS COMPASS TECNOLOGIA LTDA.
RECEBEDORA: {{CLIENT_NAME}} (CNPJ: {{CLIENT_CNPJ}}).

1. O objetivo deste acordo é proteger as Informações Confidenciais reveladas entre as partes para fins de [Descrever Finalidade, ex: Parceria Comercial].

2. A RECEBEDORA compromete-se a:
   a) Não divulgar Informações Confidenciais a terceiros sem consentimento prévio.
   b) Utilizar as informações apenas para o propósito estabelecido.
   c) Adotar medidas de segurança para proteger tais informações.

3. "Informações Confidenciais" incluem, mas não se limitam a: códigos-fonte, algoritmos, listas de clientes, estratégias de negócios e dados financeiros.

4. A vigência deste acordo é de 5 (cinco) anos a partir da data de assinatura.

5. Cláusulas Especiais:
{{SPECIAL_CLAUSES}}

São Paulo, {{CURRENT_DATE}}.

__________________________________
SAAS COMPASS TECNOLOGIA LTDA

__________________________________
{{CLIENT_NAME}}
    `
    }
];
