export const getPageLevelSocketRoomId = (
  pageId: string,
  currentGitBranch?: string,
) => {
  return currentGitBranch
    ? `${pageId}-${currentGitBranch}`
    : (pageId as string);
};
