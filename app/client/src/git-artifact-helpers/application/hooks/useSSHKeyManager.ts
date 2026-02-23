import type { SSHKeyOption } from "git/components/common/types";

export interface UseSSHKeyManagerReturn {
  isSSHKeyManagerEnabled: boolean;
  sshKeys: SSHKeyOption[] | null;
  isSSHKeysLoading: boolean;
  fetchSSHKeys: () => void;
  onCreateSSHKey: () => void;
}

import noop from "lodash/noop";

export default function useSSHKeyManager(): UseSSHKeyManagerReturn {
  return {
    isSSHKeyManagerEnabled: false,
    sshKeys: null,
    isSSHKeysLoading: false,
    fetchSSHKeys: noop,
    onCreateSSHKey: noop,
  };
}
