import type { GIT_PROVIDERS } from "./constants";

export type GitProvider = (typeof GIT_PROVIDERS)[number];

export type SSHKeySource = "existing" | "generate";

/**
 * Minimal SSH key shape needed by git components.
 * Kept here so git/ doesn't import from ee/.
 * The full SSHKey type in ee/types/sshKeysTypes is structurally compatible.
 */
export interface SSHKeyOption {
  id: string;
  name: string;
  email: string;
  keyType: string;
  gitAuth: { publicKey: string };
}

export interface ConnectFormDataState {
  gitProvider?: GitProvider;
  gitEmptyRepoExists?: string;
  gitExistingRepoExists?: boolean;
  remoteUrl?: string;
  isAddedDeployKey?: boolean;
  sshKeyType?: "RSA" | "ECDSA";
  /**
   * The source of SSH key to use: "existing" (from SSH key manager) or "generate" (new deploy key)
   */
  sshKeySource?: SSHKeySource;
  /**
   * ID of the existing SSH key to use (when sshKeySource is "existing")
   */
  sshKeyId?: string;
}
