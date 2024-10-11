import React from "react";
import { render, screen } from "test/testUtils";
import DynamicInputTextControl from "./DynamicInputTextControl";
import { reduxForm } from "redux-form";
import { mockCodemirrorRender } from "test/__mocks__/CodeMirrorEditorMock";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TestForm(props: any) {
  return <div>{props.children}</div>;
}

const ReduxFormDecorator = reduxForm({
  form: "TestForm",
  initialValues: { actionConfiguration: { testPath: "My test value" } },
})(TestForm);

describe("DynamicInputTextControl", () => {
  beforeEach(() => {
    // eslint-disable-next-line testing-library/no-render-in-lifecycle
    mockCodemirrorRender();
  });
  it("renders correctly", () => {
    render(
      <ReduxFormDecorator>
        <DynamicInputTextControl
          actionName="Test action"
          configProperty="actionConfiguration.testPath"
          controlType="DYNAMIC_INPUT_TEXT_CONTROL"
          dataType={"TABLE"}
          formName="TestForm"
          id={"test"}
          isValid
          label="Action"
          onPropertyChange={jest.fn()}
          placeholderText="Test placeholder"
        />
      </ReduxFormDecorator>,
      {},
    );

    // eslint-disable-next-line testing-library/await-async-utils
    waitFor(async () => {
      const input = screen.getAllByText("My test value")[0];

      // eslint-disable-next-line testing-library/no-wait-for-side-effects
      await userEvent.type(input, "New text");
      await expect(screen.getAllByText("New text")).toHaveLength(2);
      // eslint-disable-next-line testing-library/await-async-queries
      await expect(screen.findByText("My test value")).toBeNull();
    });
  });
});
