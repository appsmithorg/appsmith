import type { GitArtifactType } from "git/constants/enums";
import type { FetchGitMetadataResponseData } from "git/requests/fetchGitMetadataRequest.types";
import {
  selectGitConnected,
  selectGitMetadata,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useMemo } from "react";
import { useSelector } from "react-redux";

interface UseGitMetadataParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface UseGitMetadataReturnValue {
  gitMetadata: FetchGitMetadataResponseData | null;
  fetchGitMetadataLoading: boolean;
  fetchGitMetadataError: string | null;
  gitConnected: boolean;
}

export default function useGitMetadata({
  artifactType,
  baseArtifactId,
}: UseGitMetadataParams): UseGitMetadataReturnValue {
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );

  const gitMetadataState = useSelector((state: GitRootState) =>
    selectGitMetadata(state, basePayload),
  );
  const gitConnected = useSelector((state: GitRootState) =>
    selectGitConnected(state, basePayload),
  );

  return {
    gitMetadata: gitMetadataState.value,
    fetchGitMetadataLoading: gitMetadataState.loading ?? false,
    fetchGitMetadataError: gitMetadataState.error,
    gitConnected: gitConnected ?? false,
  };
}
