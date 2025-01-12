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

  const isConnectPermitted = useMemo(() => {
    if (artifact) {
      if (artifactDef?.artifactType === GitArtifactType.Application) {
        return hasConnectToGitPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactDef?.artifactType]);

  const isManageDefaultBranchPermitted = useMemo(() => {
    if (artifact) {
      if (artifactDef?.artifactType === GitArtifactType.Application) {
        return hasManageDefaultBranchPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactDef?.artifactType]);

  const isManageProtectedBranchesPermitted = useMemo(() => {
    if (artifact) {
      if (artifactDef?.artifactType === GitArtifactType.Application) {
        return hasManageProtectedBranchesPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactDef?.artifactType]);

  const isManageAutocommitPermitted = useMemo(() => {
    if (artifact) {
      if (artifactDef?.artifactType === GitArtifactType.Application) {
        return hasManageAutoCommitPermission(artifact.userPermissions);
      }
    }

    return false;
  }, [artifact, artifactDef?.artifactType]);

  return {
    isConnectPermitted,
    isManageDefaultBranchPermitted,
    isManageProtectedBranchesPermitted,
    isManageAutocommitPermitted,
  };
}
