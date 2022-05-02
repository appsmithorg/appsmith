export const isHtml = (str: string) => {
  const fragment = document.createRange().createContextualFragment(str);

  // remove all non text nodes from fragment
  fragment
    .querySelectorAll("*")
    .forEach((el: any) => el.parentNode.removeChild(el));

  // if there is textContent, then its not a pure HTML
  return !(fragment.textContent || "").trim();
};
