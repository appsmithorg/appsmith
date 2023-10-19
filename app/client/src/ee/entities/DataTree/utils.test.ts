import type { ModuleInput } from "./types";
import { ENTITY_TYPE_VALUE, EvaluationSubstitutionType } from "./types";
import { generateDataTreeModuleInputs } from "@appsmith/entities/DataTree/utils";

describe("generate module inputs in datatree", () => {
  it("generateDataTreeModuleInputs", () => {
    const moduleInputs: Record<string, ModuleInput> = {
      username: {
        name: "username",
        defaultValue: "{{appsmith.user.name}}",
      },
      email: {
        name: "email",
        defaultValue: "{{appsmith.user.email}}",
      },
    };

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
