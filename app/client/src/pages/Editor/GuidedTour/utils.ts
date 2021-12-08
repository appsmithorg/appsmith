function getCoords(elem: Element) {
  const box = elem.getBoundingClientRect();

  return {
    top: box.top + window.pageYOffset,
    right: box.right + window.pageXOffset,
    bottom: box.bottom + window.pageYOffset,
    left: box.left + window.pageXOffset,
    width: box.width,
    height: box.height,
  };
}

export function highlightSection(dataAttribute?: string) {
  //   const elements = document.getElementsByClassName("selected-row");
  //   const tableWidget = document.getElementsByClassName(
  //     "appsmith_widget_rsrxzwk730",
  //   );

  const element = document.querySelectorAll(
    `[data-guided-tour-id='${dataAttribute}']`,
  );
  //   const element: any = elements[0];

  if (!element) return;

  const message = document.createElement("div");
  message.classList.add("guided-tour-border");

  const coords = getCoords(element[0]);

  message.style.left = coords.left - 20 + "px";
  message.style.top = coords.top - 20 + "px";
  //   message.style.width = tableWidget[0].clientWidth + 40 + "px";
  message.style.width = coords.width + 40 + "px";
  message.style.height = coords.height + 40 + "px";

  document.body.append(message);

  const showAnimationDelay = 0;
  const hideAnimationDelay = showAnimationDelay + 5000;
  const removeElementDelay = hideAnimationDelay + 1000;

  setTimeout(() => {
    message.classList.add("show");
  }, showAnimationDelay);

  setTimeout(() => {
    message.classList.remove("show");
  }, hideAnimationDelay);

  setTimeout(() => {
    message.remove();
  }, removeElementDelay);
}
