import type { GitArtifactType } from "git/constants/enums";
import type { UseGitOpsReturnValue } from "./useGitOps";
import useGitOps from "./useGitOps";
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

export interface GitContextValue extends UseGitOpsReturnValue {
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
  const useGitOpsReturnValue = useGitOps({
    ...artifactDef,
    artifactId: artifact?.id ?? null,
  });

  return {
    artifactType,
    baseArtifactId,
    artifactDef,
    statusTransformer,
    artifact,
    ...useGitOpsReturnValue,
  };
}
