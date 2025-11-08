// PDF import and data extraction using Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BehaviorEntry, SeverityLevel, BehaviorFunction } from '@/types';

export interface PDFImportResult {
  success: boolean;
  behaviors: Partial<BehaviorEntry>[];
  rawText?: string;
  error?: string;
}

export async function extractBehaviorsFromPDF(
  pdfFile: File,
  apiKey: string,
  language: 'en' | 'es' = 'en'
): Promise<PDFImportResult> {
  try {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Convert PDF to base64
    const base64PDF = await fileToBase64(pdfFile);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = language === 'es'
      ? `Eres un experto en Análisis Aplicado de la Conducta (ABA). Analiza este reporte PDF de comportamientos y extrae todos los incidentes de comportamiento.

Para cada incidente de comportamiento, extrae:
1. Fecha (formato YYYY-MM-DD)
2. Hora (formato HH:MM)
3. Antecedente: Lo que pasó ANTES del comportamiento
4. Comportamiento: Descripción objetiva del comportamiento observado
5. Consecuencia: Lo que pasó DESPUÉS del comportamiento
6. Severidad: Nivel de 1 (leve) a 5 (crítico)
7. Función del comportamiento: escape, attention, tangible, o sensory
8. Duración en minutos (si está disponible)
9. Ubicación (si está disponible)
10. Notas adicionales (si hay)

Devuelve SOLO un objeto JSON con este formato:
{
  "behaviors": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "antecedent": "string",
      "behavior": "string",
      "consequence": "string",
      "severity": 1-5,
      "function": "escape|attention|tangible|sensory",
      "duration": número o null,
      "location": "string o null",
      "notes": "string o null"
    }
  ]
}

Si el PDF contiene múltiples incidentes, inclúyelos todos en el array.
Si algún campo no está disponible, usa null.
Devuelve SOLO el JSON, sin texto adicional.`
      : `You are an expert in Applied Behavior Analysis (ABA). Analyze this PDF behavior report and extract all behavior incidents.

For each behavior incident, extract:
1. Date (format YYYY-MM-DD)
2. Time (format HH:MM)
3. Antecedent: What happened BEFORE the behavior
4. Behavior: Objective description of the observed behavior
5. Consequence: What happened AFTER the behavior
6. Severity: Level from 1 (mild) to 5 (critical)
7. Behavior function: escape, attention, tangible, or sensory
8. Duration in minutes (if available)
9. Location (if available)
10. Additional notes (if any)

Return ONLY a JSON object with this format:
{
  "behaviors": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "antecedent": "string",
      "behavior": "string",
      "consequence": "string",
      "severity": 1-5,
      "function": "escape|attention|tangible|sensory",
      "duration": number or null,
      "location": "string or null",
      "notes": "string or null"
    }
  ]
}

If the PDF contains multiple incidents, include them all in the array.
If any field is not available, use null.
Return ONLY the JSON, no additional text.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64PDF,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Convert to BehaviorEntry format
    const behaviors: Partial<BehaviorEntry>[] = parsed.behaviors.map(
      (b: any) => ({
        date: b.date || new Date().toISOString().split('T')[0],
        time: b.time || new Date().toTimeString().slice(0, 5),
        antecedent: b.antecedent || '',
        behavior: b.behavior || '',
        consequence: b.consequence || '',
        severity: mapSeverity(b.severity),
        function: mapFunction(b.function),
        duration: b.duration || undefined,
        location: b.location || undefined,
        notes: b.notes || undefined,
      })
    );

    return {
      success: true,
      behaviors,
      rawText: text,
    };
  } catch (error: any) {
    console.error('Error extracting behaviors from PDF:', error);
    return {
      success: false,
      behaviors: [],
      error: error.message || 'Failed to process PDF',
    };
  }
}

export async function extractTextFromPDF(
  pdfFile: File,
  apiKey: string
): Promise<string> {
  try {
    const base64PDF = await fileToBase64(pdfFile);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64PDF,
        },
      },
      {
        text: 'Extract all text from this PDF document. Return only the extracted text.',
      },
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mapSeverity(severity: any): SeverityLevel {
  const num = parseInt(severity);
  if (num >= 1 && num <= 5) {
    return num as SeverityLevel;
  }
  return SeverityLevel.MODERATE;
}

function mapFunction(func: any): BehaviorFunction {
  const normalized = String(func).toLowerCase().trim();

  if (normalized.includes('escape') || normalized.includes('avoid')) {
    return BehaviorFunction.ESCAPE;
  }
  if (normalized.includes('attention') || normalized.includes('atención')) {
    return BehaviorFunction.ATTENTION;
  }
  if (normalized.includes('tangible') || normalized.includes('access')) {
    return BehaviorFunction.TANGIBLE;
  }
  if (normalized.includes('sensory') || normalized.includes('sensorial')) {
    return BehaviorFunction.SENSORY;
  }

  return BehaviorFunction.ESCAPE;
}

export function validateExtractedBehavior(
  behavior: Partial<BehaviorEntry>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!behavior.date) {
    errors.push('Missing date');
  }
  if (!behavior.time) {
    errors.push('Missing time');
  }
  if (!behavior.antecedent || behavior.antecedent.trim().length === 0) {
    errors.push('Missing antecedent');
  }
  if (!behavior.behavior || behavior.behavior.trim().length === 0) {
    errors.push('Missing behavior description');
  }
  if (!behavior.consequence || behavior.consequence.trim().length === 0) {
    errors.push('Missing consequence');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
