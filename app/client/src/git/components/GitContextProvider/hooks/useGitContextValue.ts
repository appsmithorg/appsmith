import type { GitArtifactType } from "git/constants/enums";
import type { UseGitConnectReturnValue } from "./useGitConnect";
import type { UseGitOpsReturnValue } from "./useGitOps";
import type { UseGitSettingsReturnValue } from "./useGitSettings";
import type { UseGitBranchesReturnValue } from "./useGitBranches";
import useGitConnect from "./useGitConnect";
import useGitOps from "./useGitOps";
import useGitBranches from "./useGitBranches";
import useGitSettings from "./useGitSettings";
import { useMemo } from "react";

interface UseGitContextValueParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface GitContextValue
  extends UseGitConnectReturnValue,
    UseGitOpsReturnValue,
    UseGitSettingsReturnValue,
    UseGitBranchesReturnValue {}

export default function useGitContextValue({
  artifactType,
  baseArtifactId,
}: UseGitContextValueParams): GitContextValue {
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );
  const useGitConnectReturnValue = useGitConnect(basePayload);
  const useGitOpsReturnValue = useGitOps(basePayload);
  const useGitBranchesReturnValue = useGitBranches(basePayload);
  const useGitSettingsReturnValue = useGitSettings(basePayload);

  return {
    ...useGitOpsReturnValue,
    ...useGitBranchesReturnValue,
    ...useGitConnectReturnValue,
    ...useGitSettingsReturnValue,
  };
}
