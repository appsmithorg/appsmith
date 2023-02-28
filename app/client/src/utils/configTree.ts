import { ConfigTree } from "entities/DataTree/dataTreeFactory";

export default class ConfigATree {
  static tree: ConfigTree = {};

  static setConfigTree = (configTree: ConfigTree) => {
    this.tree = configTree;
  };

  static getConfigTree = () => {
    return this.tree;
  };
}
