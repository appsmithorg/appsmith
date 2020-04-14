import { getPropertyControlTypes } from "./index";
import _ from "lodash";

const types = getPropertyControlTypes();

it("Checks for uniqueness of control types", () => {
  const result = Object.keys(getPropertyControlTypes());
  const output = _.uniq(result);
  expect(types.length).toEqual(output.length);
});
