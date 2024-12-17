import { useGitContext } from "git/components/GitContextProvider";

// refactor to use branch from git metadata
export default function useCurrentBranch() {
  const { artifact } = useGitContext();

  return artifact?.gitApplicationMetadata?.branchName ?? null;
}
