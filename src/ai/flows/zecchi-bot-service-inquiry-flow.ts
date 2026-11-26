'use server';
/**
 * @fileOverview A Genkit flow for the Zecchi Bot AI assistant, handling service inquiries.
 *
 * - zecchiBotServiceInquiry - A function that handles user messages for the Zecchi Bot.
 * - ZecchiBotServiceInquiryInput - The input type for the zecchiBotServiceInquiry function.
 * - ZecchiBotServiceInquiryOutput - The return type for the zecchiBotServiceInquiry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'bot']),
  text: z.string().max(1000),
});

/**
 * Defines the input schema for the Zecchi Bot service inquiry flow.
 */
const ZecchiBotServiceInquiryInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Il messaggio non può essere vuoto.')
    .max(1000, 'Il messaggio è troppo lungo.')
    .describe("The user's message to the Zecchi Bot."),
  history: z
    .array(ChatHistoryItemSchema)
    .max(10)
    .optional()
    .describe('Recent conversation turns for context.'),
});
export type ZecchiBotServiceInquiryInput = z.infer<typeof ZecchiBotServiceInquiryInputSchema>;

/**
 * Defines the output schema for the Zecchi Bot service inquiry flow.
 */
const ZecchiBotServiceInquiryOutputSchema = z.object({
  response: z.string().describe("The Zecchi Bot's response to the user."),
});
export type ZecchiBotServiceInquiryOutput = z.infer<typeof ZecchiBotServiceInquiryOutputSchema>;

/**
 * Defines the prompt for the Zecchi Bot AI assistant.
 * It includes instructions on services, how to handle quotes, and pricing restrictions.
 */
const zecchiBotPrompt = ai.definePrompt({
  name: 'zecchiBotPrompt',
  input: {
    schema: z.object({
      message: z.string(),
      conversationContext: z.string(),
    }),
  },
  output: {schema: ZecchiBotServiceInquiryOutputSchema},
  prompt: `Sei l'assistente virtuale su WhatsApp di Zecchi Monica, realtà artigiana attiva a Terracina e provincia di Latina. Rispondi in italiano con tono cordiale, diretto e conciso (stile chat WhatsApp, massimo 3-4 frasi).

Servizi offerti:
- Giardinaggio e manutenzione aree verdi (pubblico/privato)
- Pulizia terreni e decespugliamento
- Potatura e taglio piante ad alto fusto
- Pulizie condomini, residence e privati
- Piccoli lavori edili, muratura, recinzioni e vialetti
- Scavi e movimento terra
- Impianti di irrigazione automatici
- Taglio siepi

Regole:
- Se il cliente chiede un preventivo o un sopralluogo gratuito, invitalo a chiamare Monica al 340 496 2500 (o Fabio al 333 389 5067) oppure scrivere a monicazecchi56@gmail.com.
- Non inventare prezzi né fornire stime di costo.
- Non fornire contatti diversi da quelli sopra indicati.
- Non usare formattazione Markdown complessa (niente titoli o tabelle).

{{#if conversationContext}}
Cronologia recente della chat:
{{{conversationContext}}}
{{/if}}

Nuovo messaggio del cliente: {{{message}}}`,
});

/**
 * Defines the Genkit flow for handling Zecchi Bot service inquiries.
 * This flow takes a user message, processes it using the defined prompt,
 * and returns the AI's response.
 */
const zecchiBotServiceInquiryFlow = ai.defineFlow(
  {
    name: 'zecchiBotServiceInquiryFlow',
    inputSchema: ZecchiBotServiceInquiryInputSchema,
    outputSchema: ZecchiBotServiceInquiryOutputSchema,
  },
  async (input) => {
    const validated = ZecchiBotServiceInquiryInputSchema.parse(input);
    const conversationContext = (validated.history ?? [])
      .slice(-6)
      .map((item) => `${item.role === 'user' ? 'Cliente' : 'Assistente'}: ${item.text}`)
      .join('\n');

    const {output} = await zecchiBotPrompt({
      message: validated.message,
      conversationContext,
    });
    return output!;
  }
);

/**
 * Wrapper function to call the Zecchi Bot service inquiry Genkit flow.
 * @param input - The input containing the user's message.
 * @returns The AI's response to the user.
 */
export async function zecchiBotServiceInquiry(
  input: ZecchiBotServiceInquiryInput
): Promise<ZecchiBotServiceInquiryOutput> {
  return zecchiBotServiceInquiryFlow(input);
}
