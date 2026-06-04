import type { Tone } from '../components/ui';

const EVENT_META: Record<string, { icon: string; tone: Tone }> = {
  HIRED: { icon: 'user-plus', tone: 'green' },
  PROMOTION: { icon: 'arrow-up-circle', tone: 'purple' },
  SALARY_CHANGE: { icon: 'dollar', tone: 'green' },
  REVIEW: { icon: 'star', tone: 'amber' },
  GOAL_CREATED: { icon: 'target', tone: 'blue' },
  GOAL_COMPLETED: { icon: 'check-circle', tone: 'green' },
  MILESTONE: { icon: 'award', tone: 'purple' },
  STATUS_CHANGE: { icon: 'refresh', tone: 'amber' },
  NOTE: { icon: 'file-text', tone: 'gray' },
};

export function eventIcon(type: string): string {
  return EVENT_META[type]?.icon ?? 'file-text';
}

export function eventTone(type: string): Tone {
  return EVENT_META[type]?.tone ?? 'gray';
}
