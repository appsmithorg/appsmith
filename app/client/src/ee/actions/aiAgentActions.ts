import { noop } from "lodash";

export const toggleAISupportModal = noop;

// just a placeholder action to avoid type errors
export const setCreateAgentModalOpen = ({ isOpen }: { isOpen: boolean }) => ({
  type: "",
  payload: { isOpen },
});

export const openCarbonModal = ({ shouldOpen }: { shouldOpen: boolean }) => ({
  type: "",
  payload: { shouldOpen },
});

export const toggleFCIntegrations = ({
  isEnabled,
}: {
  isEnabled: boolean;
}) => ({
  type: "",
  payload: { isEnabled },
});
