import { AnvilReduxActionTypes } from "../integrations/actions/actionTypes";

export const startAnvilSpaceDistributionAction = (payload: {
  section: string;
  zones: string[];
}) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_START,
    payload,
  };
};

export const stopAnvilSpaceDistributionAction = () => {
  return {
    type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_STOP,
  };
};

export const updateSpaceDistributionAction = (
  sectionLayoutId: string,
  zonesDistributed: {
    [widgetId: string]: number;
  },
) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_UPDATE,
    payload: {
      zonesDistributed,
      sectionLayoutId,
    },
  };
};
