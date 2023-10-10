import type { ConfigTree } from "@appsmith/entities/DataTree/types";

export default class ConfigTreeActions {
  static tree: ConfigTree = {};

  static setConfigTree = (configTree: ConfigTree) => {
    this.tree = configTree || {};
  };

  static getConfigTree = () => {
    return this.tree;
  };
}
