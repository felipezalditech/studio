
'use server';
/**
 * @fileOverview Fluxo Genkit para extrair dados de um XML de NF-e.
 *
 * - extractNFeData - Função que lida com a extração dos dados da NF-e.
 * - ExtractNFeDataInput - O tipo de entrada para a função (string do XML).
 * - ExtractNFeDataOutput - O tipo de retorno para a função (dados estruturados da NF-e).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define o schema para um único produto dentro da NF-e
const NFeProductSchema = z.object({
  description: z.string().optional().describe("Descrição do produto (localizada em infNFe.det[nItem].prod.xProd). Se não houver, retorne string vazia."),
  quantity: z.number().optional().describe("Quantidade comercial (localizada em infNFe.det[nItem].prod.qCom). Se não houver, retorne 0."),
  unitValue: z.number().optional().describe("Valor unitário de comercialização (localizado em infNFe.det[nItem].prod.vUnCom). Se não houver, retorne 0."),
  totalValue: z.number().optional().describe("Valor total bruto do produto (localizado em infNFe.det[nItem].prod.vProd). Se não houver, retorne 0."),
});

// Define o schema para a entrada do fluxo
const ExtractNFeDataInputSchema = z.object({
  xmlContent: z.string().describe("Conteúdo completo do arquivo XML da NF-e."),
});
export type ExtractNFeDataInput = z.infer<typeof ExtractNFeDataInputSchema>;

// Define o schema para a saída do fluxo
const ExtractNFeDataOutputSchema = z.object({
  supplierCNPJ: z.string().optional().describe("CNPJ do emitente da NF-e (localizado em infNFe.emit.CNPJ). Se não houver, retorne string vazia."),
  supplierName: z.string().optional().describe("Razão Social ou Nome do emitente da NF-e (localizado em infNFe.emit.xNome). Se não houver, retorne string vazia."),
  invoiceNumber: z.string().optional().describe("Número da NF-e (localizado em infNFe.ide.nNF). Se não houver, retorne string vazia."),
  emissionDate: z.string().optional().describe("Data e hora de emissão da NF-e (localizada em infNFe.ide.dhEmi), no formato ISO 8601 (ex: YYYY-MM-DDTHH:MM:SSZ). Se não houver, retorne string vazia."),
  nfeTotalValue: z.number().optional().describe("Valor Total da NF-e (localizado em infNFe.total.ICMSTot.vNF). Se não houver, retorne 0."),
  shippingValue: z.number().optional().describe("Valor Total do Frete (localizado em infNFe.total.ICMSTot.vFrete). Se não houver ou for 0, retorne 0."),
  products: z.array(NFeProductSchema).optional().describe("Lista de produtos da NF-e. Extraia de cada tag 'det' dentro de 'infNFe'. Se não houver produtos, retorne um array vazio."),
});
export type ExtractNFeDataOutput = z.infer<typeof ExtractNFeDataOutputSchema>;


// Função pública que será chamada pelo frontend
export async function extractNFeData(xmlContent: string): Promise<ExtractNFeDataOutput> {
  // Chama o fluxo Genkit internamente
  const result = await extractNFeDataFlow({ xmlContent });
  // Assegura que o tipo de retorno corresponda ao ExtractNFeDataOutputSchema,
  // mesmo que o fluxo retorne algo ligeiramente diferente ou com campos extras.
  // O parse irá validar e remover campos não definidos no schema.
  return ExtractNFeDataOutputSchema.parse(result);
}

// Define o prompt para o LLM
const nfeExtractorPrompt = ai.definePrompt({
  name: 'nfeExtractorPrompt',
  input: { schema: ExtractNFeDataInputSchema },
  output: { schema: ExtractNFeDataOutputSchema },
  prompt: `
    Você é um especialista em processamento de documentos fiscais eletrônicos brasileiros (NF-e).
    Sua tarefa é analisar o conteúdo XML de uma NF-e fornecido e extrair as seguintes informações de forma precisa, seguindo o schema de saída.

    XML da NF-e:
    \`\`\`xml
    {{{xmlContent}}}
    \`\`\`

    Instruções para extração:
    1.  **supplierCNPJ**: Encontre o CNPJ do emitente. Geralmente está em \`infNFe > emit > CNPJ\`. Retorne como string.
    2.  **supplierName**: Encontre a Razão Social ou Nome do emitente. Geralmente está em \`infNFe > emit > xNome\`. Retorne como string.
    3.  **invoiceNumber**: Encontre o número da NF-e. Geralmente está em \`infNFe > ide > nNF\`. Retorne como string.
    4.  **emissionDate**: Encontre a data e hora de emissão. Geralmente está em \`infNFe > ide > dhEmi\`. Retorne como string no formato ISO 8601 (ex: "2023-10-27T10:00:00-03:00").
    5.  **nfeTotalValue**: Encontre o valor total da NF-e. Geralmente está em \`infNFe > total > ICMSTot > vNF\`. Retorne como número.
    6.  **shippingValue**: Encontre o valor total do frete. Geralmente está em \`infNFe > total > ICMSTot > vFrete\`. Se não existir ou for zero, retorne 0. Retorne como número.
    7.  **products**: Para cada item (tag \`<det>\`) dentro de \`<infNFe>\`:
        *   **description**: Descrição do produto, de \`det > prod > xProd\`. Retorne como string.
        *   **quantity**: Quantidade comercial, de \`det > prod > qCom\`. Retorne como número.
        *   **unitValue**: Valor unitário de comercialização, de \`det > prod > vUnCom\`. Retorne como número.
        *   **totalValue**: Valor total bruto do produto, de \`det > prod > vProd\`. Retorne como número.
        Se não houver itens, retorne um array vazio para 'products'.

    Se algum campo opcional não for encontrado, omita-o do objeto de saída ou retorne o valor padrão especificado (0 para números, string vazia para strings, array vazio para 'products').
    Preste atenção aos tipos de dados esperados no schema de saída (string, number). Converta os valores do XML para esses tipos. Por exemplo, valores numéricos devem ser retornados como números, não strings.
  `,
});

// Define o fluxo Genkit
const extractNFeDataFlow = ai.defineFlow(
  {
    name: 'extractNFeDataFlow',
    inputSchema: ExtractNFeDataInputSchema,
    outputSchema: ExtractNFeDataOutputSchema,
  },
  async (input) => {
    const { output } = await nfeExtractorPrompt(input);
    if (!output) {
      throw new Error("A extração de dados da NF-e falhou em retornar um resultado.");
    }
    // Certificar que o output está em conformidade com o schema, preenchendo defaults se necessário.
    // Por exemplo, se 'products' for undefined, garantir que seja um array vazio.
    // A validação do schema de output no definePrompt já ajuda nisso.
    return {
      ...output,
      products: output.products || [],
      shippingValue: output.shippingValue || 0,
    };
  }
);
