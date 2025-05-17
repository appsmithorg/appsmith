declare module 'react';
declare module 'react-beautiful-dnd';
declare module 'styled-components';
export type FC<P = {}> = (props: P) => any;
export const React: any;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
