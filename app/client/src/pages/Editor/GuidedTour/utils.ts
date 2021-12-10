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

export function highlightSection(
  selector: string,
  widthSelector?: string,
  type = "data-attribute",
) {
  let primaryReference: Element | null = null;
  let widthReference: Element | null = null;

  if (type === "data-attribute") {
    primaryReference = document.querySelector(
      `[data-guided-tour-id='${selector}']`,
    );
  } else {
    primaryReference = document.querySelector(`.${selector}`);

    if (widthSelector) {
      widthReference = document.querySelector(`.${widthSelector}`);
    }
  }

  if (!primaryReference) return;

  const highlightBorder = document.createElement("div");
  highlightBorder.classList.add("guided-tour-border");

  const coords = getCoords(primaryReference);

  const dimensionOffset = 40;
  const positionOffset = 20;

  highlightBorder.style.left = coords.left - positionOffset + "px";
  highlightBorder.style.top = coords.top - positionOffset + "px";
  highlightBorder.style.width = !!widthReference
    ? widthReference.clientWidth + dimensionOffset + "px"
    : coords.width + dimensionOffset + "px";
  highlightBorder.style.height = coords.height + 40 + "px";

  document.body.append(highlightBorder);

  const showAnimationDelay = 0;
  const hideAnimationDelay = showAnimationDelay + 4000;
  const removeElementDelay = hideAnimationDelay + 1000;

  setTimeout(() => {
    highlightBorder.classList.add("show");
  }, showAnimationDelay);

  setTimeout(() => {
    highlightBorder.classList.remove("show");
  }, hideAnimationDelay);

  setTimeout(() => {
    highlightBorder.remove();
  }, removeElementDelay);
}
