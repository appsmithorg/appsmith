import DependencyMap from "entities/DependencyMap";

export const lintingDependencyMap = new DependencyMap();

export function addAppsmithGlobalFnsToDependencyMap(
  appsmithglobalFns: string[],
) {
  const globalFunctionNodes = appsmithglobalFns.reduce(
    (globalFns, functionNode) => {
      return { ...globalFns, [functionNode]: true } as const;
    },
    {} as Record<string, true>,
  );
  lintingDependencyMap.addNodes(globalFunctionNodes);
}
