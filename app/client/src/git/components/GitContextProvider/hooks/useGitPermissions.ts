import {
  hasConnectToGitPermission,
  hasManageDefaultBranchPermission,
  hasManageProtectedBranchesPermission,
} from "ee/utils/permissionHelpers";
import type { ApplicationPayload } from "entities/Application";
import { GitArtifactType } from "git/constants/enums";
import { useMemo } from "react";

interface UseGitPermissionsParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  artifact: ApplicationPayload | null;
}

export interface UseGitPermissionsReturnValue {
  isConnectPermitted: boolean;
  isManageDefaultBranchPermitted: boolean;
  isManageProtectedBranchesPermitted: boolean;
}

export default function useGitPermissions({
  artifact,
  artifactType,
}: UseGitPermissionsParams): UseGitPermissionsReturnValue {
  const isConnectPermitted = useMemo(() => {
    if (artifact) {
      if (artifactType === GitArtifactType.Application) {
        return hasConnectToGitPermission(artifact.userPermissions);
      }
    }
  }, [artifact, artifactType]);

  const isManageDefaultBranchPermitted = useMemo(() => {
    if (artifact) {
      if (artifactType === GitArtifactType.Application) {
        return hasManageDefaultBranchPermission(artifact.userPermissions);
      }
    }
  }, [artifact, artifactType]);

  const isManageProtectedBranchesPermitted = useMemo(() => {
    if (artifact) {
      if (artifactType === GitArtifactType.Application) {
        return hasManageProtectedBranchesPermission(artifact.userPermissions);
      }
    }
  }, [artifact, artifactType]);

  return {
    isConnectPermitted: isConnectPermitted ?? false,
    isManageDefaultBranchPermitted: isManageDefaultBranchPermitted ?? false,
    isManageProtectedBranchesPermitted:
      isManageProtectedBranchesPermitted ?? false,
  };
}
