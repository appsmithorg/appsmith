import { paragon, type AuthenticatedConnectUser } from "@useparagon/connect";
import type {
  IConnectIntegration,
  IIntegrationMetadata,
} from "@useparagon/connect/dist/src/entities/integration.interface";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { keyBy } from "lodash";
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

export function useParagonIntegrationsWithWorklows() {
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const [integrations, setIntegrations] = useState<
    Record<string, IConnectIntegration>
  >({});

  const getIntegrations = async () => {
    const data = await fetch(
      `https://api.useparagon.com/projects/${currentWorkspace.projectId}/sdk/integrations`,
      {
        headers: {
          Authorization: `Bearer ${currentWorkspace.token}`,
        },
      },
    ).then((res) => res.json());

    setIntegrations(keyBy(data || [], "id"));
  };

  useEffect(() => {
    if (currentWorkspace.token && currentWorkspace.projectId) {
      getIntegrations();
    }
  }, [currentWorkspace.token]);

  return integrations;
}
