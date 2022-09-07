export function generatePropertyKey(
  path: string | undefined,
  currentPageId: string,
) {
  if (!path) return;

  return `Page[${currentPageId}].${path}`;
}
