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
import type { UseGitMetadataReturnValue } from "./useGitMetadata";
import useGitMetadata from "./useGitMetadata";

// internal dependencies
import type { ApplicationPayload } from "entities/Application";

export interface UseGitContextValueParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  artifact: ApplicationPayload | null;
  connectPermitted: boolean;
}

export interface GitContextValue
  extends UseGitMetadataReturnValue,
    UseGitConnectReturnValue,
    UseGitOpsReturnValue,
    UseGitSettingsReturnValue,
    UseGitBranchesReturnValue {
  artifact: ApplicationPayload | null;
  connectPermitted: boolean;
}

export default function useGitContextValue({
  artifact,
  artifactType,
  baseArtifactId = "",
  connectPermitted,
}: UseGitContextValueParams): GitContextValue {
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );

  const useGitMetadataReturnValue = useGitMetadata(basePayload);
  const useGitConnectReturnValue = useGitConnect(basePayload);
  const useGitOpsReturnValue = useGitOps({
    ...basePayload,
    artifactId: artifact?.id ?? null,
  });
  const useGitBranchesReturnValue = useGitBranches(basePayload);
  const useGitSettingsReturnValue = useGitSettings(basePayload);

  return {
    artifact,
    connectPermitted,
    ...useGitMetadataReturnValue,
    ...useGitOpsReturnValue,
    ...useGitBranchesReturnValue,
    ...useGitConnectReturnValue,
    ...useGitSettingsReturnValue,
  };
}
