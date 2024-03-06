export function extractFunctionParams(functionString: string) {
  // Match the parameter part of the function signature
  const match = functionString.match(/\(([^)]*)\)/);

  // Extract the matched parameters and split them by commas
  const parameters = match
    ? match[1].split(",").map((param) => param.trim().split("=")[0].trim())
    : [];

  // Filter out empty strings
  const filteredParameters = parameters.filter((param) => param !== "");

  return filteredParameters;
}
