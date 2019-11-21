import { ApplicationPayload } from "constants/ReduxActionConstants";
import faker from "faker";

export const getApplicationPayload = (): ApplicationPayload => ({
  id: faker.random.uuid(),
  name: faker.random.word(),
  organizationId: faker.random.uuid(),
  pageCount: faker.random.number(),
});

export const getApplicationPayloads = (count: number): ApplicationPayload[] => {
  return [...Array(count).keys()].map(getApplicationPayload);
};
