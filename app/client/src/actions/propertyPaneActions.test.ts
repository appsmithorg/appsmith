import * as actions from "./propertyPaneActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

describe("property pane action actions", () => {
  it("should create an action hide Property Pane", () => {
    const expectedAction = {
      type: ReduxActionTypes.HIDE_PROPERTY_PANE,
    };
    expect(actions.hidePropertyPane()).toEqual(expectedAction);
  });
});
