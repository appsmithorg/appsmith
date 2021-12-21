import lottie, { AnimationItem } from "lottie-web";
import indicator from "assets/lottie/guided-tour-indicator.json";

class IndicatorHelper {
  timerId!: number;
  indicatorWrapper!: HTMLDivElement;
  anim!: AnimationItem;
  indicatorHeightOffset: number;
  indicatorWidthOffset: number;

  constructor() {
    this.indicatorHeightOffset = 23;
    this.indicatorWidthOffset = 58;
  }

  // Remove previous indicator and create a new one
  show(primaryReference: Element | null, position?: string) {
    if (this.timerId || this.indicatorWrapper) this.destroy();
    if (!primaryReference) {
      this.destroy();
      return;
    }

    this.indicatorWrapper = document.createElement("div");
    this.indicatorWrapper.classList.add("guided-tour-indicator");
    document.body.append(this.indicatorWrapper);
    this.anim = lottie.loadAnimation({
      animationData: indicator,
      autoplay: true,
      container: this.indicatorWrapper,
      renderer: "svg",
      loop: true,
    });

    this.timerId = setInterval(() => {
      if (!primaryReference) {
        this.destroy();
        return;
      }
      const coords = getCoords(primaryReference);

      // Remove previous indicate if it is unable to find the
      // correct position
      if (coords.width === 0) {
        this.destroy();
        return;
      }

      if (position === "top") {
        this.indicatorWrapper.style.top =
          coords.top - this.indicatorHeightOffset * 2 + "px";
        this.indicatorWrapper.style.left =
          coords.width / 2 + coords.left - this.indicatorWidthOffset + "px";
      } else if (position === "bottom") {
        this.indicatorWrapper.style.top = coords.height + "px";
        this.indicatorWrapper.style.left =
          coords.width / 2 + coords.left - this.indicatorWidthOffset + "px";
      } else {
        this.indicatorWrapper.style.left =
          coords.width + coords.left + 18 - this.indicatorWidthOffset + "px";
        this.indicatorWrapper.style.top =
          coords.top - this.indicatorHeightOffset + "px";
      }
    }, 4000);
  }

  destroy() {
    this.timerId && clearInterval(this.timerId);
    this.anim && this.anim.destroy();
    this.indicatorWrapper && this.indicatorWrapper.remove();
  }
}
const indicatorHelperInstance = new IndicatorHelper();

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

  const positionOffset = 5;
  const dimensionOffset = positionOffset * 2;

  highlightBorder.style.left = coords.left - positionOffset + "px";
  highlightBorder.style.top = coords.top - positionOffset + "px";
  highlightBorder.style.width = !!widthReference
    ? widthReference.clientWidth + dimensionOffset + "px"
    : coords.width + dimensionOffset + "px";
  highlightBorder.style.height = coords.height + dimensionOffset + "px";

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

export function showIndicator(selector: string, position = "right") {
  let primaryReference: Element | null = null;

  primaryReference = document.querySelector(selector);
  indicatorHelperInstance.show(primaryReference, position);
}

export function hideIndicator() {
  indicatorHelperInstance.destroy();
}
