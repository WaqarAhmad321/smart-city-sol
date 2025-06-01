'use server';
/**
 * @fileOverview Assesses the severity of an issue reported via AR using image analysis and user description.
 *
 * - assessIssueSeverity - A function that takes an image and description of an issue and returns a severity assessment.
 * - AssessIssueSeverityInput - The input type for the assessIssueSeverity function.
 * - AssessIssueSeverityOutput - The return type for the assessIssueSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessIssueSeverityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('A detailed description of the issue.'),
});
export type AssessIssueSeverityInput = z.infer<typeof AssessIssueSeverityInputSchema>;

const AssessIssueSeverityOutputSchema = z.object({
  severity: z
    .enum(['low', 'medium', 'high'])
    .describe('The estimated severity of the issue (low, medium, or high).'),
  justification: z
    .string()
    .describe('The justification for the assigned severity, based on the image and description.'),
});
export type AssessIssueSeverityOutput = z.infer<typeof AssessIssueSeverityOutputSchema>;

export async function assessIssueSeverity(
  input: AssessIssueSeverityInput
): Promise<AssessIssueSeverityOutput> {
  return assessIssueSeverityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessIssueSeverityPrompt',
  input: {schema: AssessIssueSeverityInputSchema},
  output: {schema: AssessIssueSeverityOutputSchema},
  prompt: `You are an expert in assessing the severity of city issues based on image analysis and descriptions.

  Analyze the following information to determine the severity (low, medium, or high) of the reported issue and provide a justification for your assessment.

  Description: {{{description}}}
  Photo: {{media url=photoDataUri}}

  Respond with a JSON object conforming to the following schema:
  ${JSON.stringify(AssessIssueSeverityOutputSchema)}
  `,
});

const assessIssueSeverityFlow = ai.defineFlow(
  {
    name: 'assessIssueSeverityFlow',
    inputSchema: AssessIssueSeverityInputSchema,
    outputSchema: AssessIssueSeverityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
