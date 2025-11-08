// Analytics and data processing utilities
import { BehaviorEntry, BehaviorAnalytics, Milestone, SeverityLevel, BehaviorFunction } from '@/types';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';

export function calculateBehaviorAnalytics(behaviors: BehaviorEntry[]): BehaviorAnalytics {
  if (behaviors.length === 0) {
    return {
      totalEntries: 0,
      averageSeverity: 0,
      mostCommonFunction: BehaviorFunction.ESCAPE,
      frequencyByDay: {},
      severityDistribution: {
        [SeverityLevel.MILD]: 0,
        [SeverityLevel.MODERATE]: 0,
        [SeverityLevel.SIGNIFICANT]: 0,
        [SeverityLevel.SEVERE]: 0,
        [SeverityLevel.CRITICAL]: 0,
      },
      functionDistribution: {
        [BehaviorFunction.ESCAPE]: 0,
        [BehaviorFunction.ATTENTION]: 0,
        [BehaviorFunction.TANGIBLE]: 0,
        [BehaviorFunction.SENSORY]: 0,
      },
      timeOfDayPatterns: {},
      milestones: [],
    };
  }

  // Calculate total entries
  const totalEntries = behaviors.length;

  // Calculate average severity
  const totalSeverity = behaviors.reduce((sum, b) => sum + b.severity, 0);
  const averageSeverity = totalSeverity / totalEntries;

  // Severity distribution
  const severityDistribution = behaviors.reduce((dist, b) => {
    dist[b.severity] = (dist[b.severity] || 0) + 1;
    return dist;
  }, {} as { [key in SeverityLevel]: number });

  // Function distribution
  const functionDistribution = behaviors.reduce((dist, b) => {
    dist[b.function] = (dist[b.function] || 0) + 1;
    return dist;
  }, {} as { [key in BehaviorFunction]: number });

  // Most common function
  const mostCommonFunction = Object.entries(functionDistribution).reduce(
    (max, [func, count]) =>
      count > functionDistribution[max] ? (func as BehaviorFunction) : max,
    BehaviorFunction.ESCAPE
  );

  // Frequency by day
  const frequencyByDay = behaviors.reduce((freq, b) => {
    const day = format(parseISO(b.date), 'yyyy-MM-dd');
    freq[day] = (freq[day] || 0) + 1;
    return freq;
  }, {} as { [key: string]: number });

  // Time of day patterns
  const timeOfDayPatterns = behaviors.reduce((patterns, b) => {
    const hour = parseInt(b.time.split(':')[0]);
    patterns[hour] = (patterns[hour] || 0) + 1;
    return patterns;
  }, {} as { [hour: number]: number });

  // Detect milestones
  const milestones = detectMilestones(behaviors);

  return {
    totalEntries,
    averageSeverity,
    mostCommonFunction,
    frequencyByDay,
    severityDistribution,
    functionDistribution,
    timeOfDayPatterns,
    milestones,
  };
}

export function detectMilestones(behaviors: BehaviorEntry[]): Milestone[] {
  const milestones: Milestone[] = [];

  if (behaviors.length < 7) {
    return milestones; // Need at least a week of data
  }

  // Sort behaviors by date
  const sorted = [...behaviors].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Compare weeks for improvement/regression
  const weeklyAverages: { week: string; avgSeverity: number; count: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const behavior = sorted[i];
    const weekStart = format(
      startOfDay(new Date(behavior.date)),
      'yyyy-MM-dd'
    );

    const existing = weeklyAverages.find((w) => w.week === weekStart);
    if (existing) {
      existing.avgSeverity =
        (existing.avgSeverity * existing.count + behavior.severity) /
        (existing.count + 1);
      existing.count++;
    } else {
      weeklyAverages.push({
        week: weekStart,
        avgSeverity: behavior.severity,
        count: 1,
      });
    }
  }

  // Detect significant changes
  for (let i = 1; i < weeklyAverages.length; i++) {
    const prev = weeklyAverages[i - 1];
    const curr = weeklyAverages[i];
    const change = prev.avgSeverity - curr.avgSeverity;

    // Significant improvement: 20% reduction in severity
    if (change > 0.4 && curr.count >= 3) {
      milestones.push({
        id: `milestone-${curr.week}`,
        date: curr.week,
        type: 'improvement',
        description: `Significant improvement detected: Average severity decreased from ${prev.avgSeverity.toFixed(1)} to ${curr.avgSeverity.toFixed(1)}`,
        metric: 'severity',
        value: curr.avgSeverity,
        confidence: Math.min(curr.count / 7, 1),
      });
    }
    // Significant regression: 20% increase in severity
    else if (change < -0.4 && curr.count >= 3) {
      milestones.push({
        id: `milestone-${curr.week}`,
        date: curr.week,
        type: 'regression',
        description: `Regression detected: Average severity increased from ${prev.avgSeverity.toFixed(1)} to ${curr.avgSeverity.toFixed(1)}`,
        metric: 'severity',
        value: curr.avgSeverity,
        confidence: Math.min(curr.count / 7, 1),
      });
    }
  }

  // Detect frequency milestones
  if (weeklyAverages.length >= 2) {
    const recentWeek = weeklyAverages[weeklyAverages.length - 1];
    const previousWeek = weeklyAverages[weeklyAverages.length - 2];

    if (recentWeek.count < previousWeek.count * 0.5) {
      milestones.push({
        id: `milestone-freq-${recentWeek.week}`,
        date: recentWeek.week,
        type: 'improvement',
        description: `Behavior frequency decreased significantly: ${previousWeek.count} to ${recentWeek.count} incidents`,
        metric: 'frequency',
        value: recentWeek.count,
        confidence: 0.8,
      });
    }
  }

  return milestones;
}

export function generateChartData(behaviors: BehaviorEntry[], days: number = 30) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const filtered = behaviors.filter(
    (b) => new Date(b.date) >= cutoffDate
  );

  const dailyData: {
    [date: string]: {
      date: string;
      count: number;
      avgSeverity: number;
      total: number;
    };
  } = {};

  filtered.forEach((b) => {
    const day = format(parseISO(b.date), 'yyyy-MM-dd');
    if (!dailyData[day]) {
      dailyData[day] = { date: day, count: 0, avgSeverity: 0, total: 0 };
    }
    dailyData[day].count++;
    dailyData[day].total += b.severity;
    dailyData[day].avgSeverity = dailyData[day].total / dailyData[day].count;
  });

  return Object.values(dailyData).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function exportToCSV(behaviors: BehaviorEntry[]): string {
  const headers = [
    'Date',
    'Time',
    'Antecedent',
    'Behavior',
    'Consequence',
    'Severity',
    'Function',
    'Duration',
    'Location',
    'Notes',
  ];

  const rows = behaviors.map((b) => [
    b.date,
    b.time,
    b.antecedent,
    b.behavior,
    b.consequence,
    b.severity,
    b.function,
    b.duration || '',
    b.location || '',
    b.notes || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  return csv;
}
