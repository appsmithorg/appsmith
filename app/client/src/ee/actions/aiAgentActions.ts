import { noop } from "lodash";

export const toggleAISupportModal = noop;

// just a placeholder action to avoid type errors
export const setCreateAgentModalOpen = ({ isOpen }: { isOpen: boolean }) => ({
  type: "",
  payload: { isOpen },
});
