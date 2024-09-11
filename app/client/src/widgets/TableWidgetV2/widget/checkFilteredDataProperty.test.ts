import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import type {
  WidgetEntity,
  WidgetEntityConfig,
} from "ee/entities/DataTree/types";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";

import TableWidget from "widgets/TableWidgetV2";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
describe("Bug: check filteredTableData property in autocomplete definitions of table widget", () => {
  it("check filteredTableData property", () => {
    registerWidgets([TableWidget]);
    const dataTreeEntity: WidgetEntity = {
      meta: {},
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      widgetId: "123",
      type: "TABLE_WIDGET_V2",
      widgetName: "Table1",
      renderMode: "CANVAS",
      version: 1,
      parentColumnSpace: 1,
      parentRowSpace: 2,
      leftColumn: 2,
      rightColumn: 3,
      topRow: 1,
      bottomRow: 2,
      isLoading: false,
      tableData: [
        { id: 1, name: "pavan" },
        { id: 2, name: "anil" },
        { id: 3, name: "radha" },
      ],
      filteredTableData: [
        {
          id: 1,
          name: "pavan",
          __originalIndex__: 0,
          __primaryKey__: 1,
          EditActions1: "",
        },
        {
          id: 2,
          name: "anil",
          __originalIndex__: 1,
          __primaryKey__: 2,
          EditActions1: "",
        },
        {
          id: 3,
          name: "radha",
          __originalIndex__: 2,
          __primaryKey__: 3,
          EditActions1: "",
        },
      ],
    };
    const dataTreeEntityConfig: WidgetEntityConfig = {
      bindingPaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        onTextChange: true,
      },
      validationPaths: {},
      logBlackList: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      privateWidgets: {},
      defaultMetaProps: [],
      widgetId: "yolo",
      widgetName: "Table1",
      type: "TABLE_WIDGET_V2",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    };
    const { def, entityInfo } = dataTreeTypeDefCreator(
      {
        Table1: dataTreeEntity,
      },
      {},
      dataTreeEntityConfig,
    );
    expect(def).toHaveProperty("Table1.filteredTableData");
    expect(entityInfo.get("Table1")).toStrictEqual({
      type: ENTITY_TYPE.WIDGET,
      subType: "TABLE_WIDGET_V2",
    });
  });
});
