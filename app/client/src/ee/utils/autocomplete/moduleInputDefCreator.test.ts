import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";

describe("dataTreeTypeDefCreator for module input", () => {
  it("creates the correct def for module input entity", () => {
    const evalEntity = {
      username: "Appsmith",
      email: "123@appsmith.com",
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INPUT,
    };

    const entityConfig = {
      name: "inputs",
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INPUT,
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
    const dataTree = {
      inputs: evalEntity,
    };
    const configTree = {
      inputs: entityConfig,
    };
    const { def, entityInfo } = dataTreeTypeDefCreator(
      dataTree as DataTree,
      {},
      configTree as ConfigTree,
    );

    expect(def).toHaveProperty("inputs.username");
    expect(def).toHaveProperty("inputs.email");
    expect(def.inputs).toEqual({ username: "string", email: "string" });
    expect(entityInfo.get("inputs")).toStrictEqual({
      type: ENTITY_TYPE.MODULE_INPUT,
      subType: ENTITY_TYPE.MODULE_INPUT,
    });
  });
});
