import { paragon, type AuthenticatedConnectUser } from "@useparagon/connect";
import type { IIntegrationMetadata } from "@useparagon/connect/dist/src/entities/integration.interface";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export function useParagonUser() {
  const [paragonUser, setParagonUser] = useState<AuthenticatedConnectUser>();
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  useEffect(() => {
    paragon.configureGlobal({
      host: "https://useparagon.com",
    });
    if (currentWorkspace.token && currentWorkspace.projectId) {
      paragon
        .authenticate(currentWorkspace.projectId, currentWorkspace.token)
        .then(() => {
          setParagonUser(paragon.getUser() as AuthenticatedConnectUser);
        });
    }
  }, [currentWorkspace.token]);

  return {
    paragonUser,
  };
}

export function useParagonIntegrations() {
  const [integrations, setIntegrations] = useState<IIntegrationMetadata[]>([]);
  const { paragonUser } = useParagonUser();
  useEffect(() => {
    setIntegrations(paragon.getIntegrationMetadata());
  }, [paragonUser]);

  return {
    integrations,
  };
}
