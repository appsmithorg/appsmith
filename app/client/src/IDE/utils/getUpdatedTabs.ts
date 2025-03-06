export function getUpdatedTabs(newId: string, currentTabs: string[]) {
  if (currentTabs.includes(newId)) return currentTabs;

  const newTabs = [...currentTabs, newId];

  return newTabs;
}
