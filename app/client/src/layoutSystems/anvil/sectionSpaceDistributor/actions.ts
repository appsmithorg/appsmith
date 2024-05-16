import { AnvilReduxActionTypes } from "../integrations/actions/actionTypes";

export const startAnvilSpaceDistribution = (payload: {
  section: string;
  zones: string[];
}) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_START,
    payload,
  };
};
