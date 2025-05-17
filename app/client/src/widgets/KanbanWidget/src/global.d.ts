declare module 'react' {
  const React: any;
  export default React;
}
declare module 'react-beautiful-dnd' {
  const noop: any;
  export default noop;
}
declare module 'styled-components' {
  const styled: any;
  export default styled;
}
export type FC<P = {}> = (props: P) => any;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
