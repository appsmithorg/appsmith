import lottie, { AnimationItem } from "lottie-web";
import indicator from "assets/lottie/guided-tour-indicator.json";
import { Classes as GuidedTourClasses } from "pages/Editor/GuidedTour/constants";

// data-guided-tour-id - used for the rectangular highlight
// data-guided-tour-iid - iid(indicator id) used for the lottie animation show near an element

class IndicatorHelper {
  timerId!: number;
  indicatorWrapper!: HTMLDivElement;
  animationItem!: AnimationItem;
  indicatorHeightOffset: number;
  indicatorWidthOffset: number;

  constructor() {
    // The lottie animation has empty content around it.
    // These offsets are to compensate for the same to help with positioning it correctly.
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
    const coordinates = getCoordinates(primaryReference);

    // Remove previous indicator if it is unable to find the
    // correct position
    if (coordinates.width === 0) {
      this.destroy();
      return;
    }

    if (position === "top") {
      this.indicatorWrapper.style.top =
        coordinates.top - this.indicatorHeightOffset * 2 + offset.top + "px";
      this.indicatorWrapper.style.left =
        coordinates.width / 2 +
        coordinates.left -
        this.indicatorWidthOffset +
        "px";
    } else if (position === "bottom") {
      this.indicatorWrapper.style.top = coordinates.height + offset.top + "px";
      this.indicatorWrapper.style.left =
        coordinates.width / 2 +
        coordinates.left -
        this.indicatorWidthOffset +
        offset.left +
        "px";
    } else if (position === "left") {
      this.indicatorWrapper.style.top =
        coordinates.top + this.indicatorHeightOffset + offset.top + "px";
      this.indicatorWrapper.style.left =
        coordinates.left - this.indicatorWidthOffset + offset.left + "px";
    } else {
      this.indicatorWrapper.style.left =
        coordinates.width +
        coordinates.left -
        this.indicatorWidthOffset +
        offset.left +
        "px";
      this.indicatorWrapper.style.top =
        coordinates.top - this.indicatorHeightOffset + offset.top + "px";
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
    this.indicatorWrapper.classList.add(
      GuidedTourClasses.GUIDED_TOUR_INDICATOR,
    );
    document.body.append(this.indicatorWrapper);
    this.animationItem = lottie.loadAnimation({
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
    this.animationItem && this.animationItem.destroy();
    this.indicatorWrapper && this.indicatorWrapper.remove();
  }
}
const indicatorHelperInstance = new IndicatorHelper();

function getCoordinates(elem: Element) {
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

/**
 * This shows a rectangular border around the target element
 *
 * @param {string} selector A selector which identifies the target element around which
 * we want to show the border
 * @param {string} widthSelector Another selector which identifies an element whose width
 * we want to use instead of the primary selector
 * @param {number} type Could be a `class` selector or a `data-attribute`
 */
export function highlightSection(
  selector?: string,
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

  // We need to update the position and dimensions as and when the target's position
  // or dimension changes
  function updatePosition(element: Element) {
    const coordinates = getCoordinates(element);
    highlightBorder.style.left = coordinates.left - positionOffset + "px";
    highlightBorder.style.left = coordinates.left - positionOffset + "px";
    highlightBorder.style.top = coordinates.top - positionOffset + "px";
    highlightBorder.style.width = !!widthReference
      ? widthReference.clientWidth + dimensionOffset + "px"
      : coordinates.width + dimensionOffset + "px";
    highlightBorder.style.height = coordinates.height + dimensionOffset + "px";
  }

  const highlightBorder = document.createElement("div");
  highlightBorder.classList.add(GuidedTourClasses.GUIDED_TOUR_BORDER);

  const positionOffset = 5;
  const dimensionOffset = positionOffset * 2;

  document.body.append(highlightBorder);

  // We show the highlight border for a few seconds and then remove it
  const showAnimationDelay = 0;
  const hideAnimationDelay = showAnimationDelay + 4000;
  const removeElementDelay = hideAnimationDelay + 1000;

  setTimeout(() => {
    highlightBorder.classList.add(GuidedTourClasses.GUIDED_TOUR_SHOW_BORDER);
  }, showAnimationDelay);

  // Get the current position
  // Further location retrievals are done in 1 second intervals.
  updatePosition(primaryReference);
  const timerId = setInterval(() => {
    primaryReference && updatePosition(primaryReference);
  }, 1000);

  // Fade out the border
  setTimeout(() => {
    highlightBorder.classList.remove(GuidedTourClasses.GUIDED_TOUR_SHOW_BORDER);
  }, hideAnimationDelay);

  // Remove element from the dom
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
