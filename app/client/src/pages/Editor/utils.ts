import { debounce } from "lodash";
import ReactDOM from "react-dom";
import ResizeObserver from "resize-observer-polyfill";

export const draggableElement = (
  id: string,
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
  let isDragged = !!initPostion;

  const setElementPosition = () => {
    element.style.top = initPostion.top + "px";
    element.style.left = initPostion.left + "px";
  };

  const dragMouseDown = (e: MouseEvent) => {
    e = e || window.event;
    oldXPos = e.clientX;
    oldYPos = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  };
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
    const validFirstDrag = !isDragged && newXPos !== 0 && newYPos !== 0;
    if (validFirstDrag) {
      resizeObserver.observe(element);
      isDragged = true;
    }
  };

  const calculateNewPosition = () => {
    const { height, width, top, left } = element.getBoundingClientRect();
    const isElementOpen = height && width;
    const {
      left: calculatedLeft,
      top: calculatedTop,
    } = calculateBoundaryConfinedPosition(left, top);

    return {
      updatePosition: isDragged && isElementOpen,
      left: calculatedLeft,
      top: calculatedTop,
    };
  };

  const updateElementPosition = () => {
    const calculatedPositionData = calculateNewPosition();
    if (calculatedPositionData.updatePosition) {
      const { left, top } = calculatedPositionData;
      onPositionChange({
        left: left,
        top: top,
      });
      element.style.top = top + "px";
      element.style.left = left + "px";
    }
  };

  const closeDragElement = () => {
    updateElementPosition();
    document.onmouseup = null;
    document.onmousemove = null;
  };
  const debouncedUpdatePosition = debounce(updateElementPosition, 50);

  const resizeObserver = new ResizeObserver(function() {
    debouncedUpdatePosition();
  });

  if (isDragged) {
    resizeObserver.observe(element);
  }

  const OnInit = () => {
    if (dragHandle) {
      dragHandler = createDragHandler(id, element, dragHandle);
    }
    if (initPostion) {
      setElementPosition();
    }
    dragHandler.addEventListener("mousedown", dragMouseDown);
    // stop clicks from propogating to widget editor.
    dragHandler.addEventListener("click", (e: any) => e.stopPropagation());
  };

  OnInit();
};

const createDragHandler = (
  id: string,
  el: any,
  dragHandle: () => JSX.Element,
) => {
  const oldDragHandler = document.getElementById(`${id}-draghandler`);
  const dragElement = document.createElement("div");
  dragElement.setAttribute("id", `${id}-draghandler`);
  dragElement.style.position = "absolute";
  dragElement.style.left = "0px";
  dragElement.style.top = "0px";
  oldDragHandler
    ? el.replaceChild(dragElement, oldDragHandler)
    : el.appendChild(dragElement);
  ReactDOM.render(dragHandle(), dragElement);
  return dragElement;
};
