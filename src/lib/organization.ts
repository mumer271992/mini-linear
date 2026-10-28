// Must match the role name in prisma/seeds/roles.ts. Owners can't be revoked,
// so the UI, the revoke action, and the delete query all key off this name.
export const OWNER_ROLE_NAME = "Owner";

export function selectDefaultOrganization<T extends { id: string }>(
  organizations: T[],
  lastOrganizationId: string | null,
): T | undefined {
  return (
    organizations.find(
      (organization) => organization.id === lastOrganizationId,
    ) ?? organizations[0]
  );
}
