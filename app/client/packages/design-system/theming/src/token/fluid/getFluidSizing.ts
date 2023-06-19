export const getFluidSizing = (count = 30) => {
  return [...Array(count)].reduce((acc, value, index) => {
    return {
      ...acc,
      [index]: `calc(${index} * var(--root-unit))`,
    };
  }, {});
};
