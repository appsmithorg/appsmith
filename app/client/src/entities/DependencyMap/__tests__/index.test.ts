import DependencyMap from "..";

describe("Tests for DependencyMap", () => {
  const dataDependencyMap = new DependencyMap();
  it("should be able to add a node", () => {
    dataDependencyMap.addNodes({
      a: true,
      b: true,
    });
    expect(dataDependencyMap.nodes).toEqual({
      a: true,
      b: true,
    });
  });
  it("should be able to add a dependency", () => {
    dataDependencyMap.addDependency("a", ["b", "c"]);
    expect(dataDependencyMap.dependencies).toEqual({
      a: ["b"],
    });
    expect(dataDependencyMap.inverseDependencies).toEqual({ b: ["a"] });
    expect(dataDependencyMap.invalidDependencies).toEqual({ a: ["c"] });
    expect(dataDependencyMap.inverseInvalidDependencies).toEqual({ c: ["a"] });
  });
  it("Adding new node should recompute valid and invalid dependencies", () => {
    dataDependencyMap.addNodes({ c: true });
    expect(dataDependencyMap.dependencies).toEqual({ a: ["b", "c"] });

    expect(dataDependencyMap.inverseDependencies).toEqual({
      b: ["a"],
      c: ["a"],
    });
    expect(dataDependencyMap.invalidDependencies).toEqual({ a: [] });
    expect(dataDependencyMap.inverseInvalidDependencies).toEqual({});
  });
  it("should be able to check if nodes are connected", () => {
    dataDependencyMap.addNodes({ showAlert: true });
    dataDependencyMap.addDependency("c", ["showAlert"]);

    expect(dataDependencyMap.isRelated("a", ["showAlert"])).toEqual(true);
  });

  it("should be able to remove a node", () => {
    dataDependencyMap.removeNodes({
      c: true,
      showAlert: true,
    });
    expect(dataDependencyMap.dependencies).toEqual({ a: ["b"] });
    expect(dataDependencyMap.inverseDependencies).toEqual({ b: ["a"] });
    expect(dataDependencyMap.invalidDependencies).toEqual({ a: ["c"] });
    expect(dataDependencyMap.inverseInvalidDependencies).toEqual({ c: ["a"] });
  });
});
