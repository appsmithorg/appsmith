import type { GitProvider } from "./ChooseGitProvider";

export interface ConnectFormDataState {
  gitProvider?: GitProvider;
  gitEmptyRepoExists?: string;
  gitExistingRepoExists?: boolean;
  remoteUrl?: string;
  isAddedDeployKey?: boolean;
  sshKeyType?: "RSA" | "ECDSA";
}
