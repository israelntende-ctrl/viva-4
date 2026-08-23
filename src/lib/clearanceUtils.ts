import { Learner, SchoolSettings, ClassConfig } from '../types';

/**
 * Robust check if a learner is fully cleared based on:
 * 1. All currently assigned subjects are marked 'cleared'
 * 2. All mandatory subjects for their class are present (unless overridden)
 * 3. Fees status is 'cleared'
 */
export const checkIsFullyCleared = (learner: Learner, settings: SchoolSettings): { 
  isCleared: boolean; 
  reason?: string;
  missingMandatoryIds: string[];
} => {
  const missingMandatoryIds: string[] = [];

  // 1. Fees Check
  if (learner.feesStatus !== 'cleared') {
    return { isCleared: false, reason: 'Outstanding school fees', missingMandatoryIds };
  }

  // 2. Class-level Mandatory Policy
  const classConfig = settings.registeredClasses?.find(c => c.name === learner.class);
  const mandatoryPolicies = classConfig?.mandatorySubjectPolicies?.filter(p => p.isMandatory) || [];

  for (const policy of mandatoryPolicies) {
    const isAssigned = learner.subjects.some(s => s.id === policy.subjectId || s.code === policy.subjectId);
    const isDropped = learner.overrides?.some(o => o.subjectId === policy.subjectId && o.action === 'drop');
    
    if (!isAssigned && !isDropped) {
      missingMandatoryIds.push(policy.subjectId);
    }
  }

  if (missingMandatoryIds.length > 0) {
    return { 
      isCleared: false, 
      reason: `Missing ${missingMandatoryIds.length} mandatory subject(s)`, 
      missingMandatoryIds 
    };
  }

  // 3. Check if all assigned subjects are cleared
  if (learner.subjects.length === 0) {
    return { isCleared: false, reason: 'No subjects assigned to candidate', missingMandatoryIds };
  }

  const unclearedSubjects = learner.subjects.filter(s => s.status !== 'cleared');
  if (unclearedSubjects.length > 0) {
    return { 
      isCleared: false, 
      reason: `${unclearedSubjects.length} subjects pending clearance`, 
      missingMandatoryIds 
    };
  }

  return { isCleared: true, missingMandatoryIds };
};

/**
 * Performance optimization: Lazy loading helpers
 */
export const stripLargeData = (learners: Learner[]): Learner[] => {
  return learners.map(l => ({
    ...l,
    subjects: l.subjects.map(s => ({
      ...s,
      photoProofUrl: s.photoProofUrl ? 'LAZY_LOAD_AVAIL' : undefined,
      signatureDataUrl: s.signatureDataUrl ? 'LAZY_LOAD_AVAIL' : undefined,
    }))
  }));
};
