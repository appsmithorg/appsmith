// Filters attributes starting with "data-" and remove them from the source object and returns them back.
export const filterDataProps = (props: Record<string, unknown>) => {
  const result: Record<string, unknown> = {};

  Object.keys(props).forEach((key) => {
    if (key.startsWith("data-")) {
      result[key] = props[key];
      delete props[key];
    }
  });

  return result;
};
