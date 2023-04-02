import type { TDependencyGenerator } from "../generators";

export default class Graph {
  private graph: Record<string, string[]>;
  constructor(target: unknown, generator: TDependencyGenerator) {
    this.graph = generator.generate(target);
  }
}
