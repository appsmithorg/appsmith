export const getFluidSizing = (count = 100) => {
  return [...Array(count)].reduce(
    (acc, value, index) => {
      return {
        ...acc,
        [index + 1]: `calc(${index + 1} * var(--root-unit))`,
      };
    },
    {
      0: 0,
    },
  );
};
