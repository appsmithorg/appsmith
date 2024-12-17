import type { GitArtifactType } from "git/constants/enums";
import type { UseGitConnectReturnValue } from "./useGitConnect";
import type { UseGitOpsReturnValue } from "./useGitOps";
import type { UseGitBranchesReturnValue } from "./useGitBranches";
import useGitConnect from "./useGitConnect";
import useGitOps from "./useGitOps";
import useGitBranches from "./useGitBranches";
import { useMemo } from "react";

// internal dependencies
import type { ApplicationPayload } from "entities/Application";
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import type { StatusTreeStruct } from "git/components/StatusChanges/StatusTree";

export interface UseGitContextValueParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  artifact: ApplicationPayload | null;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
}

export interface GitContextValue
  extends UseGitConnectReturnValue,
    UseGitOpsReturnValue,
    UseGitBranchesReturnValue {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  artifactDef: {
    artifactType: keyof typeof GitArtifactType;
    baseArtifactId: string;
  };
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
  const artifactDef = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );
  const useGitConnectReturnValue = useGitConnect(artifactDef);
  const useGitOpsReturnValue = useGitOps({
    ...artifactDef,
    artifactId: artifact?.id ?? null,
  });
  const useGitBranchesReturnValue = useGitBranches(artifactDef);

  return {
    artifactType,
    baseArtifactId,
    artifactDef,
    statusTransformer,
    artifact,
    ...useGitOpsReturnValue,
    ...useGitBranchesReturnValue,
    ...useGitConnectReturnValue,
  };
}
