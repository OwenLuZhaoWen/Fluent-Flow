export type Language = 'Spanish' | 'French' | 'Japanese' | 'German' | 'Italian' | 'Mandarin' | 'English';
export type Scenario = 'Casual Chat' | 'Coffee Shop' | 'Job Interview' | 'At the Airport' | 'Lost in the City';

export interface SetupOptions {
  language: Language;
  scenario: Scenario;
  userProficiency: 'Beginner' | 'Intermediate' | 'Advanced';
}

export function generateSystemInstruction(opts: SetupOptions) {
  const { language, scenario, userProficiency } = opts;
  
  return `You are a conversational AI partner helping a human practice speaking ${language}.
Their proficiency is ${userProficiency}. 
Adapt your vocabulary and speaking speed appropriately.

The scenario they want to practice is: ${scenario}.
Play your role naturally in this scenario.

IMPORTANT RULES:
1. ALWAYS respond in ${language}. Never use English, unless the user explicitly asks for a translation or explanation.
2. Keep your turns relatively short (1-3 sentences) so the human has plenty of time to practice.
3. Every so often, if the human makes a grammatical mistake, warmly correct them.
4. Try to ask questions to keep the conversation going!
5. Be warm, friendly, and patient.
`;
}
