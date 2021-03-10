import { debounce } from "lodash";
import ReactDOM from "react-dom";
import ResizeObserver from "resize-observer-polyfill";

export const draggableElement = (
  element: any,
  onPositionChange: any,
  initPostion?: any,
  dragHandle?: () => JSX.Element,
) => {
  let newXPos = 0,
    newYPos = 0,
    oldXPos = 0,
    oldYPos = 0;
  let dragHandler = element;

  const setElementPosition = () => {
    element.style.top = initPostion.top + "px";
    element.style.left = initPostion.left + "px";
  };
  if (dragHandle) {
    dragHandler = createDragHandler(element, dragHandle);
  }

  if (initPostion) {
    setElementPosition();
  }
  const dragMouseDown = (e: MouseEvent) => {
    e = e || window.event;
    e.preventDefault();
    oldXPos = e.clientX;
    oldYPos = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  };
  dragHandler.onmousedown = dragMouseDown;
  const calculateBoundaryConfinedPosition = (
    calculatedLeft: number,
    calculatedTop: number,
  ) => {
    if (calculatedLeft <= 0) {
      calculatedLeft = 0;
    }
    if (calculatedTop <= 30) {
      calculatedTop = 30;
    }
    if (calculatedLeft >= window.innerWidth - element.clientWidth) {
      calculatedLeft = window.innerWidth - element.clientWidth;
    }
    if (calculatedTop >= window.innerHeight - element.clientHeight) {
      calculatedTop = window.innerHeight - element.clientHeight;
    }
    return {
      left: calculatedLeft,
      top: calculatedTop,
    };
  };

  const elementDrag = (e: MouseEvent) => {
    e = e || window.event;
    e.preventDefault();
    newXPos = oldXPos - e.clientX;
    newYPos = oldYPos - e.clientY;
    oldXPos = e.clientX;
    oldYPos = e.clientY;
    const calculatedTop = element.offsetTop - newYPos;
    const calculatedLeft = element.offsetLeft - newXPos;
    element.style.top = calculatedTop + "px";
    element.style.left = calculatedLeft + "px";
  };

  const closeDragElement = () => {
    const { left, top } = calculateBoundaryConfinedPosition(
      element.getBoundingClientRect().left,
      element.getBoundingClientRect().top,
    );
    onPositionChange({
      left: left,
      top: top,
    });
    element.style.top = top + "px";
    element.style.left = left + "px";
    document.onmouseup = null;
    document.onmousemove = null;
  };
  const debouncedClose = debounce(closeDragElement, 50);

  const resizeObserver = new ResizeObserver(function() {
    debouncedClose();
  });
  resizeObserver.observe(element);
};

const createDragHandler = (el: any, dragHandle: () => JSX.Element) => {
  const dragElement = document.createElement("div");
  dragElement.style.position = "absolute";
  dragElement.style.left = "0px";
  dragElement.style.top = "0px";
  el.appendChild(dragElement);
  ReactDOM.render(dragHandle(), dragElement);
  return dragElement;
};
