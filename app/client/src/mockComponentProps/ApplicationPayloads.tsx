import { ApplicationPayload } from "constants/ReduxActionConstants";
import { generateReactKey } from "utils/generators";
export const getApplicationPayload = (): ApplicationPayload => ({
  id: generateReactKey(),
  name: generateReactKey(),
  organizationId: generateReactKey(),
  pageCount: 4,
});

export const getApplicationPayloads = (count: number): ApplicationPayload[] => {
  return [...Array(count).keys()].map(getApplicationPayload);
};
