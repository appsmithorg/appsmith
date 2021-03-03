import { ApplicationPayload } from "constants/ReduxActionConstants";
import { AppsmithDefaultLayout } from "pages/Editor/MainContainerLayoutControl";
import { generateReactKey } from "utils/generators";
export const getApplicationPayload = (): ApplicationPayload => ({
  id: generateReactKey(),
  name: generateReactKey(),
  organizationId: generateReactKey(),
  appIsExample: false,
  appLayout: AppsmithDefaultLayout,
});

export const getApplicationPayloads = (count: number): ApplicationPayload[] => {
  return [...Array(count).keys()].map(getApplicationPayload);
};
