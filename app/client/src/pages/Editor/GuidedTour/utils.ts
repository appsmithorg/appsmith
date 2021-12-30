import lottie, { AnimationItem } from "lottie-web";
import indicator from "assets/lottie/guided-tour-indicator.json";

// data-guided-tour-id - used for the rectangular highlight
// data-guided-tour-iid - iid(indicator id) used for the lottie animation show near an element

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

  calculate(
    primaryReference: Element | null,
    position: string,
    offset: {
      top: number;
      left: number;
    },
  ) {
    if (!primaryReference) {
      this.destroy();
      return;
    }
    const coords = getCoords(primaryReference);

    // Remove previous indicator if it is unable to find the
    // correct position
    if (coords.width === 0) {
      this.destroy();
      return;
    }

    if (position === "top") {
      this.indicatorWrapper.style.top =
        coords.top - this.indicatorHeightOffset * 2 + offset.top + "px";
      this.indicatorWrapper.style.left =
        coords.width / 2 + coords.left - this.indicatorWidthOffset + "px";
    } else if (position === "bottom") {
      this.indicatorWrapper.style.top = coords.height + offset.top + "px";
      this.indicatorWrapper.style.left =
        coords.width / 2 +
        coords.left -
        this.indicatorWidthOffset +
        offset.left +
        "px";
    } else if (position === "left") {
      this.indicatorWrapper.style.top =
        coords.top + this.indicatorHeightOffset - 18 + offset.top + "px";
      this.indicatorWrapper.style.left =
        coords.left - this.indicatorWidthOffset + offset.left + "px";
    } else {
      this.indicatorWrapper.style.left =
        coords.width +
        coords.left +
        18 -
        this.indicatorWidthOffset +
        offset.left +
        "px";
      this.indicatorWrapper.style.top =
        coords.top - this.indicatorHeightOffset + offset.top + "px";
    }
  }

  // Remove previous indicator and create a new one
  show(
    primaryReference: Element | null,
    position: string,
    offset: {
      top: number;
      left: number;
    },
  ) {
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

    // This is to invoke at the start and then recalculate every 3 seconds
    // 3 seconds is an arbitrary value here to avoid calling getBoundingClientRect to many times
    this.calculate(primaryReference, position, offset);
    this.timerId = setInterval(() => {
      this.calculate(primaryReference, position, offset);
    }, 3000);
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

  function updatePosition(element: Element) {
    const coords = getCoords(element);
    highlightBorder.style.left = coords.left - positionOffset + "px";
    highlightBorder.style.left = coords.left - positionOffset + "px";
    highlightBorder.style.top = coords.top - positionOffset + "px";
    highlightBorder.style.width = !!widthReference
      ? widthReference.clientWidth + dimensionOffset + "px"
      : coords.width + dimensionOffset + "px";
    highlightBorder.style.height = coords.height + dimensionOffset + "px";
  }

  const highlightBorder = document.createElement("div");
  highlightBorder.classList.add("guided-tour-border");

  const positionOffset = 5;
  const dimensionOffset = positionOffset * 2;

  document.body.append(highlightBorder);

  const showAnimationDelay = 0;
  const hideAnimationDelay = showAnimationDelay + 4000;
  const removeElementDelay = hideAnimationDelay + 1000;

  setTimeout(() => {
    highlightBorder.classList.add("show");
  }, showAnimationDelay);

  // Get the current position
  // Further location retrievals are done in 1 second intervals.
  updatePosition(primaryReference);
  const timerId = setInterval(() => {
    primaryReference && updatePosition(primaryReference);
  }, 1000);

  setTimeout(() => {
    highlightBorder.classList.remove("show");
  }, hideAnimationDelay);

  setTimeout(() => {
    highlightBorder.remove();
    clearInterval(timerId);
  }, removeElementDelay);
}

export function showIndicator(
  selector: string,
  position = "right",
  offset = { top: 0, left: 0 },
) {
  let primaryReference: Element | null = null;

  primaryReference = document.querySelector(selector);
  indicatorHelperInstance.show(primaryReference, position, offset);
}

export function hideIndicator() {
  indicatorHelperInstance.destroy();
}
