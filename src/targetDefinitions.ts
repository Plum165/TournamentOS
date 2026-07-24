import { TargetFaceDefinition, TargetType } from './types';

export const TARGET_DEFINITIONS: Record<TargetType, TargetFaceDefinition> = {
  '122cm': {
    id: '122cm',
    name: 'Outdoor 122cm Face',
    rings: [
      { value: 'X', radius: 10, color: '#FEF08A', textColor: '#1E293B' }, // Yellow-X
      { value: '10', radius: 20, color: '#FACC15', textColor: '#1E293B' }, // Yellow-10
      { value: '9', radius: 40, color: '#EAB308', textColor: '#1E293B' }, // Yellow-9
      { value: '8', radius: 60, color: '#EF4444', textColor: '#FFFFFF' }, // Red-8
      { value: '7', radius: 80, color: '#DC2626', textColor: '#FFFFFF' }, // Red-7
      { value: '6', radius: 100, color: '#3B82F6', textColor: '#FFFFFF' }, // Blue-6
      { value: '5', radius: 120, color: '#2563EB', textColor: '#FFFFFF' }, // Blue-5
      { value: '4', radius: 140, color: '#1E293B', textColor: '#FFFFFF' }, // Black-4
      { value: '3', radius: 160, color: '#0F172A', textColor: '#FFFFFF' }, // Black-3
      { value: '2', radius: 180, color: '#F1F5F9', textColor: '#1E293B' }, // White-2
      { value: '1', radius: 200, color: '#CBD5E1', textColor: '#1E293B' }, // White-1
    ],
  },
  '80cm': {
    id: '80cm',
    name: 'Outdoor 80cm Face',
    rings: [
      { value: 'X', radius: 10, color: '#FEF08A', textColor: '#1E293B' },
      { value: '10', radius: 20, color: '#FACC15', textColor: '#1E293B' },
      { value: '9', radius: 40, color: '#EAB308', textColor: '#1E293B' },
      { value: '8', radius: 60, color: '#EF4444', textColor: '#FFFFFF' },
      { value: '7', radius: 80, color: '#DC2626', textColor: '#FFFFFF' },
      { value: '6', radius: 100, color: '#3B82F6', textColor: '#FFFFFF' },
      { value: '5', radius: 120, color: '#2563EB', textColor: '#FFFFFF' },
      { value: '4', radius: 140, color: '#1E293B', textColor: '#FFFFFF' },
      { value: '3', radius: 160, color: '#0F172A', textColor: '#FFFFFF' },
      { value: '2', radius: 180, color: '#F1F5F9', textColor: '#1E293B' },
      { value: '1', radius: 200, color: '#CBD5E1', textColor: '#1E293B' },
    ],
  },
  'indoor-40cm': {
    id: 'indoor-40cm',
    name: 'Indoor 40cm Face (5-10)',
    rings: [
      { value: 'X', radius: 10, color: '#FEF08A', textColor: '#1E293B' },
      { value: '10', radius: 20, color: '#FACC15', textColor: '#1E293B' },
      { value: '9', radius: 55, color: '#EAB308', textColor: '#1E293B' },
      { value: '8', radius: 90, color: '#EF4444', textColor: '#FFFFFF' },
      { value: '7', radius: 125, color: '#DC2626', textColor: '#FFFFFF' },
      { value: '6', radius: 160, color: '#3B82F6', textColor: '#FFFFFF' },
      { value: '5', radius: 200, color: '#2563EB', textColor: '#FFFFFF' },
    ],
  },
  'indoor-40cm-single': {
    id: 'indoor-40cm-single',
    name: 'Indoor 40cm Single Spot (1-10)',
    rings: [
      { value: 'X', radius: 10, color: '#FEF08A', textColor: '#1E293B' },
      { value: '10', radius: 20, color: '#FACC15', textColor: '#1E293B' },
      { value: '9', radius: 40, color: '#EAB308', textColor: '#1E293B' },
      { value: '8', radius: 60, color: '#EF4444', textColor: '#FFFFFF' },
      { value: '7', radius: 80, color: '#DC2626', textColor: '#FFFFFF' },
      { value: '6', radius: 100, color: '#3B82F6', textColor: '#FFFFFF' },
      { value: '5', radius: 120, color: '#2563EB', textColor: '#FFFFFF' },
      { value: '4', radius: 140, color: '#1E293B', textColor: '#FFFFFF' },
      { value: '3', radius: 160, color: '#0F172A', textColor: '#FFFFFF' },
      { value: '2', radius: 180, color: '#F1F5F9', textColor: '#1E293B' },
      { value: '1', radius: 200, color: '#CBD5E1', textColor: '#1E293B' },
    ],
  },
  'practice': {
    id: 'practice',
    name: 'Practice Face',
    rings: [
      { value: 'X', radius: 15, color: '#10B981', textColor: '#FFFFFF' }, // emerald center
      { value: '10', radius: 30, color: '#047857', textColor: '#FFFFFF' },
      { value: '9', radius: 60, color: '#1E293B', textColor: '#FFFFFF' },
      { value: '8', radius: 90, color: '#334155', textColor: '#FFFFFF' },
      { value: '7', radius: 120, color: '#475569', textColor: '#FFFFFF' },
      { value: '6', radius: 150, color: '#64748B', textColor: '#FFFFFF' },
      { value: '5', radius: 180, color: '#F1F5F9', textColor: '#1E293B' },
      { value: '4', radius: 200, color: '#E2E8F0', textColor: '#1E293B' },
    ],
  },
};

/**
 * Calculates score from absolute distance from target center (0,0) with scale 0..200
 */
export function calculateScoreFromCoords(x: number, y: number, targetType: TargetType): { score: string; value: number } {
  const distance = Math.sqrt(x * x + y * y);
  const def = TARGET_DEFINITIONS[targetType];
  
  // Find first ring containing this distance
  for (const ring of def.rings) {
    if (distance <= ring.radius) {
      let value = parseInt(ring.value, 10);
      if (ring.value === 'X') value = 10;
      if (isNaN(value)) value = 0;
      return { score: ring.value, value };
    }
  }
  
  return { score: 'M', value: 0 };
}
