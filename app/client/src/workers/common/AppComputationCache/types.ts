import type { APP_MODE } from "entities/App";

export enum EComputationCacheName {
  DEPENDENCY_MAP = "DEPENDENCY_MAP",
  ALL_KEYS = "ALL_KEYS",
}

export interface ICacheProps {
  appId: string;
  pageId: string;
  appMode?: APP_MODE;
  timestamp: string;
  instanceId: string;
  workspaceId: string;
}
