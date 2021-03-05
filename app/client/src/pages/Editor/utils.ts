import ReactDOM from "react-dom";

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
    element.style.top = element.offsetTop - initPostion.top + "px";
    element.style.left = element.offsetLeft - initPostion.left + "px";
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

  const elementDrag = (e: MouseEvent) => {
    e = e || window.event;
    e.preventDefault();
    newXPos = oldXPos - e.clientX;
    newYPos = oldYPos - e.clientY;
    oldXPos = e.clientX;
    oldYPos = e.clientY;
    let calculatedTop = element.offsetTop - newYPos;
    let calculatedLeft = element.offsetLeft - newXPos;
    if (calculatedLeft <= 0) {
      calculatedLeft = 15;
    }
    if (calculatedTop <= 0) {
      calculatedTop = 30;
    }
    if (calculatedLeft <= 0) {
      calculatedLeft = 15;
    }
    if (calculatedTop <= 0) {
      calculatedTop = 30;
    }
    if (calculatedLeft >= window.innerWidth - element.clientWidth) {
      calculatedLeft = window.innerWidth - element.clientWidth;
    }
    if (calculatedTop >= window.innerHeight - element.clientHeight) {
      calculatedTop = window.innerHeight - element.clientHeight;
    }
    element.style.top = calculatedTop + "px";
    element.style.left = calculatedLeft + "px";
    console.log(`offsetTop: ${element.offsetTop}`, `newYPos: ${newYPos}`);
    console.log(`offsetLeft: ${element.offsetLeft}`, `newXPos: ${newXPos}`);
  };

  const closeDragElement = () => {
    onPositionChange({
      left: element.getBoundingClientRect().left,
      top: element.getBoundingClientRect().top,
    });
    document.onmouseup = null;
    document.onmousemove = null;
  };
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
