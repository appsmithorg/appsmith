export const getIsStartingWithRemoteBranches = (curr: string, next: string) => {
  const remotePrefix = "origin/";

  return (
    curr &&
    !curr.startsWith(remotePrefix) &&
    next &&
    next.startsWith(remotePrefix)
  );
};
