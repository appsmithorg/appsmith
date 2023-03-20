import type { ConfigTree } from "entities/DataTree/dataTreeFactory";

export default class ConfigTreeActions {
  static tree: ConfigTree = {};

  static setConfigTree = (configTree: ConfigTree) => {
    this.tree = configTree;
  };

  static getConfigTree = () => {
    return this.tree;
  };
}
