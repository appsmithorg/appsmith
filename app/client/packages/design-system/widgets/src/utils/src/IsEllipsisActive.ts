export const isEllipsisActive = (element: HTMLElement | null) => {
  return (
    (element && element.clientWidth < element.scrollWidth) ||
    (element && element.clientHeight < element.scrollHeight)
  );
};
