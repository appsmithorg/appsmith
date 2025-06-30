import DependencyMap from "../index";
import { DependencyMapUtils } from "../DependencyMapUtils";
import { PluginType } from "entities/Plugin";
import {
  ENTITY_TYPE,
  type DataTreeEntityConfig,
  type MetaArgs,
} from "ee/entities/DataTree/types";
import type { ActionRunBehaviourType } from "PluginActionEditor/types/PluginActionTypes";

describe("detectReactiveDependencyMisuse", () => {
  function makeConfigTreeWithAction(
    entityName: string,
    runBehaviour: ActionRunBehaviourType = "AUTOMATIC",
  ): DataTreeEntityConfig {
    return {
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      dynamicTriggerPathList: [{ key: "run" }],
      dynamicBindingPathList: [],
      bindingPaths: {},
      reactivePaths: {},
      dependencyMap: {},
      logBlackList: {},
      pluginType: PluginType.API,
      pluginId: "mockPluginId",
      actionId: "mockActionId",
      name: entityName,
      runBehaviour,
    };
  }

  function makeConfigTreeWithJSAction(
    entityName: string,
    meta: Record<string, MetaArgs> = {},
  ): DataTreeEntityConfig {
    return {
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      meta,
      dynamicBindingPathList: [],
      actionNames: new Set(["myFun1", "myFun2"]),
      bindingPaths: {},
      reactivePaths: {},
      dependencyMap: {},
      pluginType: PluginType.JS,
      name: entityName,
      actionId: "mockJSActionId",
      dynamicTriggerPathList: [],
      variables: [],
    };
  }

  function makeConfigTreeWithWidget(entityName: string): DataTreeEntityConfig {
    return {
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      bindingPaths: {},
      reactivePaths: {},
      triggerPaths: {},
      validationPaths: {},
      logBlackList: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      privateWidgets: {},
      widgetId: "mockWidgetId",
      defaultMetaProps: [],
      type: "MOCK_WIDGET_TYPE",
      dynamicBindingPathList: [],
      name: entityName,
    };
  }

  it("does not throw for Widget entity", () => {
    const dependencyMap = new DependencyMap();

    dependencyMap.addNodes({
      Widget1: true,
      "Widget1.run": true,
      "Widget1.data": true,
    });
    dependencyMap.addDependency("Widget1", ["Widget1.run", "Widget1.data"]);
    const configTree = {
      Widget1: makeConfigTreeWithWidget("Widget1"),
    };

    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).not.toThrow();
  });

  it("does not throw for MANUAL ACTION entity", () => {
    const dependencyMap = new DependencyMap();

    dependencyMap.addNodes({
      "JSObject1.myFun1": true,
      "Query3.run": true,
      "Query3.data": true,
    });
    dependencyMap.addDependency("JSObject1.myFun1", [
      "Query3.run",
      "Query3.data",
    ]);
    const configTree = {
      Query3: makeConfigTreeWithAction("Query3", "MANUAL"),
      JSObject1: makeConfigTreeWithJSAction("JSObject1", {
        myFun1: {
          runBehaviour: "MANUAL",
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun2: {
          runBehaviour: "MANUAL",
          arguments: [],
          confirmBeforeExecute: false,
        },
      }),
    };

    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).not.toThrow();
  });

  it("does not throw for JSAction entity with no AUTOMATIC function", () => {
    const dependencyMap = new DependencyMap();

    dependencyMap.addNodes({
      "JSObject1.myFun1": true,
      "JSObject1.myFun2": true,
      "Query2.run": true,
      "Query2.data": true,
    });
    // JSObject1.myFun2 depends on Query2.run
    dependencyMap.addDependency("JSObject1.myFun2", ["Query2.run"]);
    // JSObject1.myFun1 depends on both JSObject1.myFun2 and and Query2.data (transitive)
    dependencyMap.addDependency("JSObject1.myFun1", [
      "JSObject1.myFun2",
      "Query2.data",
    ]);

    // meta has no AUTOMATIC runBehaviour
    const configTree = {
      JSObject1: makeConfigTreeWithJSAction("JSObject1", {
        myFun1: {
          runBehaviour: "MANUAL",
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun2: {
          runBehaviour: "MANUAL",
          arguments: [],
          confirmBeforeExecute: false,
        },
      }),
      Query2: makeConfigTreeWithAction("Query2", "AUTOMATIC"),
    };

    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).not.toThrow();
  });

  it("does not throw if a node depends only on .run or only on .data for AUTOMATIC ACTION", () => {
    const configTree = {
      Api1: makeConfigTreeWithAction("Api1", "AUTOMATIC"),
      JSObject1: makeConfigTreeWithJSAction("JSObject1", {
        myFun1: {
          runBehaviour: "AUTOMATIC",
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun2: {
          runBehaviour: "AUTOMATIC",
          arguments: [],
          confirmBeforeExecute: false,
        },
      }),
      JSObject2: makeConfigTreeWithJSAction("JSObject2", {
        myFun1: {
          runBehaviour: "AUTOMATIC",
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun2: {
          runBehaviour: "AUTOMATIC",
          arguments: [],
          confirmBeforeExecute: false,
        },
      }),
    };

    // Only .run
    const depMapRun = new DependencyMap();

    depMapRun.addNodes({ "JSObject1.myFun1": true, "Api1.run": true });
    depMapRun.addDependency("JSObject1.myFun1", ["Api1.run"]);

    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(depMapRun, configTree);
    }).not.toThrow();

    // Only .data
    const depMapData = new DependencyMap();

    depMapData.addNodes({ "JSObject2.myFun1": true, "Api1.data": true });
    depMapData.addDependency("JSObject2.myFun1", ["Api1.data"]);
    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(depMapData, configTree);
    }).not.toThrow();
  });

  it("throws if a node depends on both .run and .data of the same AUTOMATIC ACTION entity", () => {
    const dependencyMap = new DependencyMap();

    // Add nodes
    dependencyMap.addNodes({
      "JSObject1.myFun1": true,
      "Query1.run": true,
      "Query1.data": true,
    });
    // JSObject1.myFun1 depends on both Query1.run and Query1.data
    dependencyMap.addDependency("JSObject1.myFun1", [
      "Query1.run",
      "Query1.data",
    ]);
    const configTree = {
      JSObject1: makeConfigTreeWithJSAction("JSObject1", {
        myFun1: {
          runBehaviour: "AUTOMATIC",
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun2: {
          runBehaviour: "MANUAL",
          arguments: [],
          confirmBeforeExecute: false,
        },
      }),
      Query1: makeConfigTreeWithAction("Query1", "AUTOMATIC"),
    };

    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).toThrow(/Reactive dependency misuse/);
  });

  it("throws if a node depends on both .run and .data of the same AUTOMATIC ACTION entity via transitive dependency", () => {
    const dependencyMap = new DependencyMap();

    dependencyMap.addNodes({
      "JSObject1.myFun1": true,
      "JSObject1.myFun2": true,
      "Query2.run": true,
      "Query2.data": true,
    });
    // JSObject1.myFun2 depends on Query2.run
    dependencyMap.addDependency("JSObject1.myFun2", ["Query2.run"]);
    // JSObject1.myFun1 depends on both JSObject1.myFun2 and and Query2.data (transitive)
    dependencyMap.addDependency("JSObject1.myFun1", [
      "JSObject1.myFun2",
      "Query2.data",
    ]);
    const configTree = {
      Query2: makeConfigTreeWithAction("Query2", "AUTOMATIC"),
      JSObject1: makeConfigTreeWithJSAction("JSObject1", {
        myFun1: {
          runBehaviour: "AUTOMATIC",
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun2: {
          runBehaviour: "MANUAL",
          arguments: [],
          confirmBeforeExecute: false,
        },
      }),
    };

    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).toThrow(/Reactive dependency misuse/);
  });

  it("throws for JSAction entity with at least one AUTOMATIC function", () => {
    // meta has one AUTOMATIC runBehaviour
    const dependencyMap = new DependencyMap();

    dependencyMap.addNodes({
      "JSObject1.myFun1": true,
      "JSObject1.myFun2": true,
      "Query2.run": true,
      "Query2.data": true,
    });
    // JSObject1.myFun2 depends on Query2.run
    dependencyMap.addDependency("JSObject1.myFun2", ["Query2.run"]);
    // JSObject1.myFun1 depends on both JSObject1.myFun2 and and Query2.data (transitive)
    dependencyMap.addDependency("JSObject1.myFun1", [
      "JSObject1.myFun2",
      "Query2.data",
    ]);
    const configTree = {
      JSObject1: makeConfigTreeWithJSAction("JSObject1", {
        myFun1: {
          runBehaviour: "AUTOMATIC",
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun2: {
          runBehaviour: "MANUAL",
          arguments: [],
          confirmBeforeExecute: false,
        },
      }),
      Query2: makeConfigTreeWithAction("Query2", "MANUAL"),
    };

    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).toThrow(/Reactive dependency misuse/);
  });
});
