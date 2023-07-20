import type { ProvisioningReduxState } from "@appsmith/reducers/ProvisioningReducer";

export type MethodType = {
  id: string;
  category?: string;
  label: string;
  subText?: string;
  image?: string;
  icon?: string;
};

export type ScimProps = {
  provisioningDetails: ProvisioningReduxState;
};

export type DisableScimModalProps = {
  provisioningDetails: ProvisioningReduxState;
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
};
