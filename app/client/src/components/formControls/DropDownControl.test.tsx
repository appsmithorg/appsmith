import React from "react";
import { render, screen, waitFor, fireEvent } from "test/testUtils";
import DropDownControl from "./DropDownControl";
import { reduxForm } from "redux-form";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

const mockStore = configureStore([]);

const initialValues = {
  actionConfiguration: {
    testPath: ["option1", "option2"],
  },
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TestForm(props: any) {
  return <div>{props.children}</div>;
}

const ReduxFormDecorator = reduxForm({
  form: "TestForm",
  initialValues,
})(TestForm);

const mockOptions = [
  { label: "Option 1", value: "option1", children: "Option 1" },
  { label: "Option 2", value: "option2", children: "Option 2" },
  { label: "Option 3", value: "option3", children: "Option 3" },
];

const mockAction = {
  type: "API_ACTION",
  name: "Test API Action",
  datasource: {
    id: "datasource1",
    name: "Datasource 1",
  },
  actionConfiguration: {
    body: "",
    headers: [],
    testPath: ["option1", "option2"],
  },
};

const dropDownProps = {
  options: mockOptions,
  placeholderText: "Select Columns",
  isMultiSelect: true,
  configProperty: "actionConfiguration.testPath",
  controlType: "PROJECTION",
  propertyValue: "",
  label: "Columns",
  id: "column",
  formName: "",
  isValid: true,
  formValues: mockAction,
  isLoading: false,
};

describe("DropDownControl", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore({
      form: {
        TestForm: {
          values: initialValues,
        },
      },
      appState: {},
    });
  });
  it("should renders dropdownControl and options properly", async () => {
    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...dropDownProps} />
        </ReduxFormDecorator>
      </Provider>,
    );

    const dropdownSelect = await waitFor(async () =>
      screen.findByTestId("t--dropdown-actionConfiguration.testPath"),
    );

    expect(dropdownSelect).toBeInTheDocument();

    const options = screen.getAllByText(/Optio.../);
    const optionCount = options.length;

    expect(optionCount).toBe(2);
  });

  it("should clear all selected options", async () => {
    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...dropDownProps} />
        </ReduxFormDecorator>
      </Provider>,
    );

    const clearAllButton = document.querySelector(".rc-select-clear");

    expect(clearAllButton).toBeInTheDocument();

    fireEvent.click(clearAllButton!);

    await waitFor(() => {
      const options = screen.queryAllByText(/Option.../);

      expect(options.length).toBe(0);
    });
  });
});
