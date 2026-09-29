import { ForbiddenError } from './errors';

/**
 * Asserts that a staff user has access to the given lab.
 * SUPER_ADMINs always pass. COORDINATORs with no labId pass (unassigned = all labs).
 * COORDINATORs with a labId must match the requested labId exactly.
 */
export const assertLabAccess = (user: any, labId: string): void => {
  if (user.role === 'SUPER_ADMIN') return;
  if (!user.labId) return;
  if (user.labId.toString() !== labId) throw new ForbiddenError('Access denied to this lab');
};
