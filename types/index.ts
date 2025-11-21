// Behavior tracking types based on ABA methodology

export enum SeverityLevel {
  MILD = 1,
  MODERATE = 2,
  SIGNIFICANT = 3,
  SEVERE = 4,
  CRITICAL = 5,
}

export enum BehaviorFunction {
  ESCAPE = 'escape',
  ATTENTION = 'attention',
  TANGIBLE = 'tangible',
  SENSORY = 'sensory',
}

export interface BehaviorEntry {
  id: string;
  date: string;
  time: string;
  antecedent: string;
  behavior: string;
  consequence: string;
  severity: SeverityLevel;
  function: BehaviorFunction;
  duration?: number; // in minutes
  intensity?: number; // 1-10 scale
  location?: string;
  notes?: string;
  createdBy?: string; // Profile ID of creator
  createdAt: string;
  updatedAt: string;
}

export enum ReinforcerType {
  EDIBLE = 'edible',
  TANGIBLE = 'tangible',
  ACTIVITY = 'activity',
  SOCIAL = 'social',
}

export interface Reinforcer {
  id: string;
  name: string;
  type: ReinforcerType;
  lastUsed?: string;
  usageCount: number;
  effectiveness: number; // 1-5 rating
  avoidRepetitionDays?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrisisProtocol {
  id: string;
  name: string;
  triggerConditions: string[];
  preventionStrategies: string[];
  interventionSteps: string[];
  safetyMeasures: string[];
  deEscalationTechniques: string[];
  postCrisisFollowUp: string[];
  emergencyContacts: EmergencyContact[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface Milestone {
  id: string;
  date: string;
  type: 'improvement' | 'regression' | 'neutral';
  description: string;
  metric: string;
  value: number;
  confidence: number;
}

export interface BehaviorAnalytics {
  totalEntries: number;
  averageSeverity: number;
  mostCommonFunction: BehaviorFunction;
  frequencyByDay: { [key: string]: number };
  severityDistribution: { [key in SeverityLevel]: number };
  functionDistribution: { [key in BehaviorFunction]: number };
  timeOfDayPatterns: { [hour: number]: number };
  milestones: Milestone[];
}

export interface AIRecommendation {
  type: 'prevention' | 'intervention' | 'strategy';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  rationale: string;
  confidence: number;
}

export interface AIAnalysis {
  predictions: string[];
  recommendations: AIRecommendation[];
  patterns: string[];
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: string;
}

export enum ProfileType {
  PARENT = 'parent',
  THERAPIST = 'therapist',
  CAREGIVER = 'caregiver',
}

export interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  email?: string;
  color: string; // Hex color for avatar/identification
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
