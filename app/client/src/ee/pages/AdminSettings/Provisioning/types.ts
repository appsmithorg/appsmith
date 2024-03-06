import type { ProvisioningReduxState } from "@appsmith/reducers/ProvisioningReducer";

export interface MethodType {
  id: string;
  category?: string;
  label: string;
  subText?: string;
  image?: string;
  icon?: string;
}

export interface ScimProps {
  provisioningDetails: ProvisioningReduxState;
}

export interface DisableScimModalProps {
  provisioningDetails: ProvisioningReduxState;
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
}
