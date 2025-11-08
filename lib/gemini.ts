// Google Gemini AI integration for behavior analysis
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BehaviorEntry, AIAnalysis, AIRecommendation, BehaviorFunction } from '@/types';

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function analyzeBehaviorPatterns(
  behaviors: BehaviorEntry[]
): Promise<AIAnalysis> {
  if (!genAI) {
    throw new Error('Gemini AI not initialized. Please set API key in settings.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `You are an expert in Applied Behavior Analysis (ABA) methodology. Analyze the following behavior data and provide insights.

Behavior Data:
${JSON.stringify(behaviors, null, 2)}

Based on ABA gold standards, provide:
1. Pattern analysis: Identify recurring patterns in antecedents, behaviors, and consequences
2. Function analysis: Determine the most likely behavioral functions
3. Predictions: Predict potential future behaviors based on patterns
4. Recommendations: Provide evidence-based intervention strategies
5. Risk assessment: Evaluate current risk level

Format your response as a JSON object with the following structure:
{
  "predictions": ["prediction 1", "prediction 2"],
  "recommendations": [
    {
      "type": "prevention|intervention|strategy",
      "priority": "high|medium|low",
      "recommendation": "specific recommendation",
      "rationale": "ABA-based rationale",
      "confidence": 0.0-1.0
    }
  ],
  "patterns": ["pattern 1", "pattern 2"],
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
  context: string
): Promise<string[]> {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `As an ABA expert, suggest intervention strategies for this behavior:

Antecedent: ${behavior.antecedent}
Behavior: ${behavior.behavior}
Consequence: ${behavior.consequence}
Function: ${behavior.function}
Severity: ${behavior.severity}

Additional Context: ${context}

Provide 3-5 specific, evidence-based intervention strategies following ABA methodology. Focus on:
- Antecedent modifications
- Teaching replacement behaviors
- Consequence modifications
- Environmental adjustments

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
