import RichTextEditorWidget, { type RichTextEditorWidgetProps } from "./index";

describe("RichTextEditorWidget getWidgetView", () => {
  it.each([true, false])(
    "should pass isRequired=%s to the component",
    (isRequired) => {
      const widget = new RichTextEditorWidget({
        isRequired,
        labelText: "Description",
        text: "",
        widgetId: "rte-widget",
      } as unknown as RichTextEditorWidgetProps);

      // getWidgetView wraps the lazy-loaded component in <Suspense>
      expect(widget.getWidgetView().props.children.props.isRequired).toBe(
        isRequired,
      );
    },
  );
});
