import { ApplicationPayload } from "constants/ReduxActionConstants";
import Chance from "chance";

const chance = new Chance();

export const getApplicationPayload = (): ApplicationPayload => ({
  id: chance.guid(),
  name: chance.word(),
  organizationId: chance.guid(),
  pageCount: chance.natural(),
});

export const getApplicationPayloads = (count: number): ApplicationPayload[] => {
  return [...Array(count).keys()].map(getApplicationPayload);
};
