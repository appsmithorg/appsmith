import { DefaultDiffGenerator, JSLintDiffGenerator } from "./diffGenerator";

export type { EntityDiffGenerator } from "./diffGeneratorTypes";
export const defaultDiffGenerator = new DefaultDiffGenerator();
export const jsLintDiffGenerator = new JSLintDiffGenerator();
