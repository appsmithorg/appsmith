import DependencyMap from "../index";
import { DependencyMapUtils } from "../DependencyMapUtils";
import type { ConfigTree } from "entities/DataTree/dataTreeTypes";
import { PluginType } from "entities/Plugin";

describe("detectReactiveDependencyMisuse", () => {
  function makeConfigTreeWithAction(entityName: string): ConfigTree {
    return {
      [entityName]: {
        ENTITY_TYPE: "ACTION",
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
        runBehaviour: "MANUAL",
      },
    };
  }

  it("throws if a node depends on both .run and .data of the same ACTION entity - scenario 1", () => {
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

    const configTree = makeConfigTreeWithAction("Query1");

    // Should throw
    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).toThrow(/Reactive dependency misuse/);
  });

  it("does not throw if a node depends only on .run or only on .data", () => {
    const configTree = makeConfigTreeWithAction("Api1");

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

  it("throws if a node depends on both .run and .data of the same ACTION entity via transitive dependency - scenario 2", () => {
    const dependencyMap = new DependencyMap();

    // Add nodes
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

    const configTree = makeConfigTreeWithAction("Query2");

    // Should throw
    expect(() => {
      DependencyMapUtils.detectReactiveDependencyMisuse(
        dependencyMap,
        configTree,
      );
    }).toThrow(/Reactive dependency misuse/);
  });
});
