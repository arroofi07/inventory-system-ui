export function requireRole(userRole: string | undefined, allowed: string[]): boolean {
	if (!userRole) return false;
	return allowed.includes(userRole);
}
