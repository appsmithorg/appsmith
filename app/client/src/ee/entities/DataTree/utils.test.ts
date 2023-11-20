import type { Module } from "@appsmith/constants/ModuleConstants";
import { ENTITY_TYPE_VALUE, EvaluationSubstitutionType } from "./types";
import { generateDataTreeModuleInputs } from "@appsmith/entities/DataTree/utils";

describe("generate module inputs in datatree", () => {
  it("generateDataTreeModuleInputs", () => {
    const moduleInputs: Module["inputsForm"] = [
      {
        id: "abc",
        sectionName: "",
        children: [
          {
            id: "i123",
            label: "username",
            propertyName: "input.username",
            defaultValue: "{{appsmith.user.name}}",
            controlType: "INPUT_TEXT",
          },
          {
            id: "i456",
            label: "email",
            propertyName: "input.email",
            defaultValue: "{{appsmith.user.email}}",
            controlType: "INPUT_TEXT",
          },
        ],
      },
    ];

    const expectedUnevalEntity = {
      username: "{{appsmith.user.name}}",
      email: "{{appsmith.user.email}}",
      ENTITY_TYPE: ENTITY_TYPE_VALUE.MODULE_INPUT,
    };

    const expectedConfig = {
      name: "inputs",
      ENTITY_TYPE: ENTITY_TYPE_VALUE.MODULE_INPUT,
      bindingPaths: {
        username: EvaluationSubstitutionType.TEMPLATE,
        email: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        username: EvaluationSubstitutionType.TEMPLATE,
        email: EvaluationSubstitutionType.TEMPLATE,
      },
      dynamicBindingPathList: [{ key: "username" }, { key: "email" }],
    };
    const resultData = generateDataTreeModuleInputs(moduleInputs);
    expect(resultData.unEvalEntity).toStrictEqual(expectedUnevalEntity);
    expect(resultData.configEntity).toStrictEqual(expectedConfig);
  });
});
