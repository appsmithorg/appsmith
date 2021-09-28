export type position = { x: number; y: number };
export type transform = { x: number; y: number; zoom: number };

export function noop() {
  //
}

export const clamp = (min: number, max: number) => (value: number) =>
  Math.max(min, Math.min(value, max));

export function dist(a: position, b: position) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function getPositionOnElement(
  element: HTMLElement | null | undefined,
  position: position,
): position {
  const positionOnElement = { ...position };
  while (element) {
    positionOnElement.x -= element.offsetLeft;
    positionOnElement.y -= element.offsetTop;
    element = <HTMLElement | undefined>element.offsetParent;
  }
  return positionOnElement;
}
