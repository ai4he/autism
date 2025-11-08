// Google Gemini AI integration for behavior analysis
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BehaviorEntry, AIAnalysis, AIRecommendation, BehaviorFunction } from '@/types';

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function analyzeBehaviorPatterns(
  behaviors: BehaviorEntry[],
  language: 'en' | 'es' = 'en'
): Promise<AIAnalysis> {
  if (!genAI) {
    throw new Error('Gemini AI not initialized. Please set API key in settings.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const languageInstruction = language === 'es'
    ? 'Proporciona todas las respuestas en español, usando lenguaje claro y comprensible para padres.'
    : 'Provide all responses in English, using clear and understandable language for parents.';

  const prompt = `You are an expert in Applied Behavior Analysis (ABA) methodology helping parents understand their child's behavior patterns. ${languageInstruction}

IMPORTANT: Interpret all information in the context of THIS SPECIFIC CHILD. All recommendations should be personalized based on their unique behavior patterns, not generic advice.

Child's Behavior Data (${behaviors.length} total entries):
${JSON.stringify(behaviors.slice(0, 50), null, 2)}

Based on ABA gold standards and THIS CHILD'S specific data, provide:
1. Pattern analysis: Identify recurring patterns specific to this child's antecedents, behaviors, and consequences
2. Function analysis: Determine the most likely behavioral functions for THIS child
3. Predictions: Predict potential future behaviors based on THIS child's patterns
4. Recommendations: Provide evidence-based intervention strategies tailored to THIS child's specific needs and patterns
5. Risk assessment: Evaluate current risk level based on THIS child's severity trends

Use empathetic, parent-friendly language. Focus on actionable insights specific to this child's data.

Format your response as a JSON object with the following structure:
{
  "predictions": ["prediction 1 (child-specific)", "prediction 2"],
  "recommendations": [
    {
      "type": "prevention|intervention|strategy",
      "priority": "high|medium|low",
      "recommendation": "specific recommendation for this child",
      "rationale": "ABA-based rationale tied to this child's patterns",
      "confidence": 0.0-1.0
    }
  ],
  "patterns": ["pattern 1 specific to this child", "pattern 2"],
  "riskLevel": "low|medium|high"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const analysis: AIAnalysis = JSON.parse(jsonMatch[0]);
    analysis.timestamp = new Date().toISOString();

    return analysis;
  } catch (error) {
    console.error('Error analyzing behaviors with Gemini:', error);
    throw error;
  }
}

export async function generateInterventionStrategies(
  behavior: BehaviorEntry,
  context: string,
  language: 'en' | 'es' = 'en'
): Promise<string[]> {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const languageInstruction = language === 'es'
    ? 'Proporciona todas las estrategias en español, usando lenguaje claro y práctico para padres.'
    : 'Provide all strategies in English, using clear and practical language for parents.';

  const prompt = `As an ABA expert helping a parent, suggest intervention strategies specifically tailored to their child. ${languageInstruction}

Specific Behavior Instance:
Antecedent: ${behavior.antecedent}
Behavior: ${behavior.behavior}
Consequence: ${behavior.consequence}
Function: ${behavior.function}
Severity: ${behavior.severity}
${behavior.notes ? `Additional Notes: ${behavior.notes}` : ''}

Child's Behavioral Context: ${context}

Based on THIS CHILD'S specific patterns and needs, provide 3-5 personalized, evidence-based intervention strategies following ABA methodology. Focus on:
- Antecedent modifications specific to this child's triggers
- Teaching replacement behaviors appropriate for this child's skill level
- Consequence modifications that fit this child's reinforcement profile
- Environmental adjustments based on this child's patterns

Use empathetic, actionable language that parents can implement at home.

Return only a JSON array of strings: ["strategy 1", "strategy 2", ...]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating strategies:', error);
    throw error;
  }
}

export async function predictBehaviorTriggers(
  recentBehaviors: BehaviorEntry[]
): Promise<string[]> {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analyze these recent behavior incidents and predict likely triggers:

${JSON.stringify(recentBehaviors, null, 2)}

Based on ABA principles, identify potential triggers and warning signs. Return a JSON array of predicted triggers: ["trigger 1", "trigger 2", ...]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error predicting triggers:', error);
    throw error;
  }
}

export async function generateCrisisProtocol(
  behaviorType: string,
  severity: number
): Promise<{
  preventionStrategies: string[];
  interventionSteps: string[];
  deEscalationTechniques: string[];
}> {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Create a crisis behavior protocol for:
Behavior Type: ${behaviorType}
Severity Level: ${severity}/5

Based on ABA best practices, provide:
1. Prevention strategies (before behavior occurs)
2. Intervention steps (during behavior)
3. De-escalation techniques

Return JSON format:
{
  "preventionStrategies": ["strategy 1", ...],
  "interventionSteps": ["step 1", ...],
  "deEscalationTechniques": ["technique 1", ...]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating crisis protocol:', error);
    throw error;
  }
}
