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
  maxTagCount: 3,
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

describe("DropDownControl grouping tests", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore({
      form: {
        GroupingTestForm: {
          values: {
            actionConfiguration: { testPath: [] },
          },
        },
      },
    });
  });

  it("should render grouped options correctly when optionGroupConfig is provided", async () => {
    // These config & options demonstrate grouping
    const mockOptionGroupConfig = {
      testGrp1: {
        label: "Group 1",
        children: [],
      },
      testGrp2: {
        label: "Group 2",
        children: [],
      },
    };

    const mockGroupedOptions = [
      {
        label: "Option 1",
        value: "option1",
        children: "Option 1",
        optionGroupType: "testGrp1",
      },
      {
        label: "Option 2",
        value: "option2",
        children: "Option 2",
        // Intentionally no optionGroupType => Should fall under default "Others" group
      },
      {
        label: "Option 3",
        value: "option3",
        children: "Option 3",
        optionGroupType: "testGrp2",
      },
    ];

    const props = {
      ...dropDownProps,
      controlType: "DROP_DOWN",
      options: mockGroupedOptions,
      optionGroupConfig: mockOptionGroupConfig,
    };

    render(
      <Provider store={store}>
        <ReduxFormDecorator>
          <DropDownControl {...props} />
        </ReduxFormDecorator>
      </Provider>,
    );

    // 1. Grab the dropdown container
    const dropdownSelect = await waitFor(async () =>
      screen.findByTestId("t--dropdown-actionConfiguration.testPath"),
    );

    expect(dropdownSelect).toBeInTheDocument();

    // 2. Click to open the dropdown
    // @ts-expect-error: the test will fail if component doesn't exist
    fireEvent.mouseDown(dropdownSelect.querySelector(".rc-select-selector"));

    // 3. We expect to see group labels from the config
    // 'Group 1' & 'Group 2' come from the mockOptionGroupConfig
    const group1Label = await screen.findByText("Group 1");
    const group2Label = await screen.findByText("Group 2");

    expect(group1Label).toBeInTheDocument();
    expect(group2Label).toBeInTheDocument();

    // 4. Check that the 'Others' group also exists because at least one option did not have optionGroupType
    // The default group label is 'Others' (in your code)
    const othersGroupLabel = await screen.findByText("Others");

    expect(othersGroupLabel).toBeInTheDocument();

    // 5. Confirm the correct distribution of options
    // For group1 -> "Option 1"
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    // For group2 -> "Option 3"
    expect(screen.getByText("Option 3")).toBeInTheDocument();
    // For default "Others" -> "Option 2"
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });
});
