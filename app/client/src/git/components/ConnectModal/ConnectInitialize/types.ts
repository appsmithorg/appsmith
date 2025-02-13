import type { GIT_PROVIDERS } from "./constants";

export type GitProvider = (typeof GIT_PROVIDERS)[number];

export interface ConnectFormDataState {
  gitProvider?: GitProvider;
  gitEmptyRepoExists?: string;
  gitExistingRepoExists?: boolean;
  remoteUrl?: string;
  isAddedDeployKey?: boolean;
  sshKeyType?: "RSA" | "ECDSA";
}
