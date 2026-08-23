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
