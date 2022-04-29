import {
  JSONtoForm,
  JSONtoFormProps,
} from "pages/Editor/DataSourceEditor/JSONtoForm";
import { ControlProps } from "components/formControls/BaseControl";

const config: ControlProps = {
  formName: "test-json-to-form",
  id: "1",
  label: "",
  configProperty: "test-json-to-form.data",
  controlType: "DROPDOWN",
  isValid: true,
  initialValue: "",
  isRequired: true,
  hidden: {
    path: "",
    comparison: "EQUALS",
    value: "",
  },
  encrypted: false,
};

const jsontoFormProps: JSONtoFormProps = {
  formName: "test-json-to-form",
  formData: {
    id: "1",
    pluginId: "1",
    name: "test-s3",
    isValid: true,
    organizationId: "9",
    datasourceConfiguration: {
      url: "",
      authentication: {},
    },
  },
  formConfig: [],
  datasourceId: "1",
  isReconnectingModalOpen: false,
};

describe("Validator", () => {
  const jsontoForm = new JSONtoForm(jsontoFormProps);

  test("setupConfig is defined", () => {
    expect(typeof jsontoForm.setupConfig).toBe("function");
    expect(jsontoForm.requiredFields).toBe("");
  });
});
