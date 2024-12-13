import {
  hasConnectToGitPermission,
  hasManageAutoCommitPermission,
  hasManageDefaultBranchPermission,
  hasManageProtectedBranchesPermission,
} from "ee/utils/permissionHelpers";
import { useGitContext } from "git/components/GitContextProvider";
import { GitArtifactType } from "git/constants/enums";
import { useMemo } from "react";

export default function useGitPermissions() {
  const { artifact, artifactDef } = useGitContext();
  const { artifactType } = artifactDef;

  const isConnectPermitted = useMemo(() => {
    if (artifact) {
      if (artifactType === GitArtifactType.Application) {
        return hasConnectToGitPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactType]);

  const isManageDefaultBranchPermitted = useMemo(() => {
    if (artifact) {
      if (artifactType === GitArtifactType.Application) {
        return hasManageDefaultBranchPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactType]);

  const isManageProtectedBranchesPermitted = useMemo(() => {
    if (artifact) {
      if (artifactType === GitArtifactType.Application) {
        return hasManageProtectedBranchesPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactType]);

  const isManageAutocommitPermitted = useMemo(() => {
    if (artifact) {
      if (artifactType === GitArtifactType.Application) {
        return hasManageAutoCommitPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactType]);

  return {
    isConnectPermitted,
    isManageDefaultBranchPermitted,
    isManageProtectedBranchesPermitted,
    isManageAutocommitPermitted,
  };
}
