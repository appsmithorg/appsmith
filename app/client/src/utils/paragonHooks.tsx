import { paragon, type AuthenticatedConnectUser } from "@useparagon/connect";
import type { IIntegrationMetadata } from "@useparagon/connect/dist/src/entities/integration.interface";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
const PROJECT_ID = "PROJECT_ID";

export function useParagonUser() {
  const [paragonUser, setParagonUser] = useState<AuthenticatedConnectUser>();
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  const generateJWT = () => {
    return "JWT Token";
  };

  const requestWorkflows = async () => {
    const data = await fetch(
      `https://proxy.useparagon.com/projects/${PROJECT_ID}/workflows/zendesk`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${generateJWT()}`,
          "Content-Type": "application/json",
        },
      },
    ).then((res) => res.json());
    console.log(data);
  };

  useEffect(() => {
    paragon.configureGlobal(
      {
        host: "https://useparagon.com",
      },
      {
        VERSION: "1.1.0",
      },
    );
    if (currentWorkspace.id) {
      paragon.authenticate(PROJECT_ID, generateJWT()).then(() => {
        setParagonUser(paragon.getUser() as AuthenticatedConnectUser);
      });
      requestWorkflows();
    }
  }, [currentWorkspace.id]);

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
