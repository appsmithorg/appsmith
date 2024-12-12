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
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import type { StatusTreeStruct } from "git/components/GitStatus/StatusTree";
import useGitPermissions, {
  type UseGitPermissionsReturnValue,
} from "./useGitPermissions";

export interface UseGitContextValueParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  artifact: ApplicationPayload | null;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
}

export interface GitContextValue
  extends UseGitMetadataReturnValue,
    UseGitConnectReturnValue,
    UseGitOpsReturnValue,
    UseGitSettingsReturnValue,
    UseGitBranchesReturnValue,
    UseGitPermissionsReturnValue {
  artifact: ApplicationPayload | null;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
}

export default function useGitContextValue({
  artifact,
  artifactType,
  baseArtifactId = "",
  statusTransformer,
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
  const useGitPermissionsReturnValue = useGitPermissions({
    ...basePayload,
    artifact,
  });

  return {
    statusTransformer,
    artifact,
    ...useGitMetadataReturnValue,
    ...useGitOpsReturnValue,
    ...useGitBranchesReturnValue,
    ...useGitConnectReturnValue,
    ...useGitSettingsReturnValue,
    ...useGitPermissionsReturnValue,
  };
}
