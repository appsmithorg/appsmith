export const intersectionAPI = (
  callback: any,
  id: string,
  parentCanvas: any,
) => {
  const observer = new IntersectionObserver(
    (entries) => {
      callback(entries);
    },
    {
      root: document.getElementById("appsmith-editor"),
      rootMargin: "0px",
    },
  );
  const el = document.getElementById(id);
  if (el) {
    observer.observe(el);
  }
};
