// import React from "react";
// import { render, fireEvent } from "@testing-library/react";
// import ImageWidget, { ImageWidgetProps } from "./ImageWidget";

// import { useDrag } from "react-dnd";
// import { Provider } from "react-redux";
// import configureStore from "redux-mock-store";
// import { ThemeProvider, theme, light, dark } from "constants/DefaultTheme";

// import "@testing-library/jest-dom";

// jest.mock("react-dnd", () => ({
//   useDrag: jest.fn().mockReturnValue([{ isDragging: false }, jest.fn()]),
// }));

// describe("<ImageWidget />", () => {
//   const initialState = {
//     ui: {
//       widgetDragResize: {
//         selectedWidget: "",
//       },
//       propertyPane: {
//         isVisible: true,
//         widgetId: "Widget1",
//       },
//     },
//     entities: { canvasWidgets: {} },
//   };

//   function renderImageWidget(props: Partial<ImageWidgetProps> = {}) {
//     const defaultProps: ImageWidgetProps = {
//       image: "",
//       defaultImage: "",
//       widgetId: "Widget1",
//       type: "IMAGE_WIDGET",
//       widgetName: "Image1",
//       parentId: "Container1",
//       renderMode: "CANVAS",
//       parentColumnSpace: 2,
//       parentRowSpace: 3,
//       leftColumn: 2,
//       rightColumn: 3,
//       topRow: 1,
//       bottomRow: 3,
//       isLoading: false,
//       imageShape: "RECTANGLE",
//       onClick: "",
//     };
//     // Mock store to bypass the error of react-redux
//     const store = configureStore()(initialState);
//     return render(
//       <Provider store={store}>
//         <ThemeProvider
//           theme={{ ...theme, colors: { ...theme.colors, ...dark } }}
//         >
//           <ImageWidget {...defaultProps} {...props} />
//         </ThemeProvider>
//       </Provider>,
//     );
//   }

//   const yellow =
//     "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
//   const red =
//     " iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg== ";

//   test("should be empty when image and defaultImage both are empty.", async () => {
//     const { queryByTestId } = renderImageWidget({
//       image: "",
//       defaultImage: "",
//     });

//     expect(queryByTestId("styledImage")).toHaveStyle(
//       `background-image: url("")`,
//     );
//   });

//   test("should display image when image and defaultImage both are present.", async () => {
//     const props = { image: yellow, defaultImage: red };
//     const { queryByTestId } = renderImageWidget(props);

//     expect(queryByTestId("styledImage")).toHaveStyle(
//       `background-image: url(${props.image})`,
//     );
//   });

//   test("should display image when image is present and defaultImage is absent.", async () => {
//     const props = { image: yellow, defaultImage: undefined };
//     const { queryByTestId } = renderImageWidget(props);

//     expect(queryByTestId("styledImage")).toHaveStyle(
//       `background-image: url(${props.image})`,
//     );
//   });

//   test("should display defaultImage when image is absent and defaultImage is present.", async () => {
//     const props = { image: "", defaultImage: red };
//     const { container, queryByTestId } = renderImageWidget(props);

//     // Fire onError event manually to update the background-image.
//     const imageElement = container.querySelector("img") as Element;
//     expect(imageElement).toBeInTheDocument();
//     fireEvent(imageElement, new Event("error"));

//     expect(queryByTestId("styledImage")).toHaveStyle(
//       `background-image: url(${props.defaultImage})`,
//     );
//   });

//   test("should display defaultImage when image is given a var with no value and defaultImage is present.", async () => {
//     const dynamicProperty = undefined;
//     const props = { image: dynamicProperty, defaultImage: red };
//     const { container, queryByTestId } = renderImageWidget(props);

//     // Fire onError event manually to update the background-image.
//     // For src as `undefined`, the browser doesn't trigger the onError event automatically.
//     const imageElement = container.querySelector("img") as Element;
//     expect(imageElement).toBeInTheDocument();
//     fireEvent(imageElement, new Event("error"));

//     expect(queryByTestId("styledImage")).toHaveStyle(
//       `background-image: url(${props.defaultImage})`,
//     );
//   });
// });
it("does nothing. needs implementing", () => {
  expect(1 + 1).toEqual(2);
});
