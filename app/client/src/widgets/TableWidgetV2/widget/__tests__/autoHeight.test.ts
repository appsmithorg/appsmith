import { RenderModes } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import { DynamicHeight } from "utils/WidgetFeatures";
import TableWidgetV2 from "..";
import type { TableWidgetProps } from "../../constants";

const baseProps = {
  widgetId: "widgetId",
  widgetName: "Table1",
  type: "TABLE_WIDGET_V2",
  renderMode: RenderModes.CANVAS,
  componentWidth: 800,
  componentHeight: 600,
  pageNo: 1,
  pageSize: 5,
  tableData: [],
  filteredTableData: [],
  primaryColumns: {},
  orderedTableColumns: [],
  columnOrder: [],
  selectedRowIndices: [],
  isVisibleSearch: false,
  isVisibleFilters: false,
  isVisibleDownload: false,
  isVisiblePagination: false,
  infiniteScrollEnabled: false,
  dynamicHeight: DynamicHeight.FIXED,
  commitBatchMetaUpdates: jest.fn(),
  pushBatchMetaUpdates: jest.fn(),
  updateWidgetMetaProperty: jest.fn(),
} as unknown as TableWidgetProps;

const getTableComponentProps = (props: Partial<TableWidgetProps>) => {
  const widget = new TableWidgetV2({ ...baseProps, ...props });

  return widget.getWidgetView().props.children.props;
};

describe("TableWidgetV2 auto height", () => {
  describe("registration", () => {
    it("registers the dynamic height feature in the General section, defaulting to Fixed", () => {
      expect(TableWidgetV2.getFeatures()).toEqual({
        dynamicHeight: expect.objectContaining({
          sectionIndex: 6,
          active: true,
          defaultValue: DynamicHeight.FIXED,
        }),
      });
    });

    it("explains the Height control only when height is auto", () => {
      const { helperText } = TableWidgetV2.getFeatures().dynamicHeight;
      const withHeight = (dynamicHeight: DynamicHeight) =>
        ({ dynamicHeight }) as unknown as WidgetProps;
      const message =
        "The table grows to fit Pagination > Rows per page (up to 200 rows). Infinite scroll is turned off.";

      expect(helperText(withHeight(DynamicHeight.FIXED))).toBe("");
      expect(helperText(withHeight(DynamicHeight.AUTO_HEIGHT))).toBe(message);
      expect(
        helperText(withHeight(DynamicHeight.AUTO_HEIGHT_WITH_LIMITS)),
      ).toBe(message);
    });

    it("defaults Rows per page to 10", () => {
      expect(TableWidgetV2.getDefaults()).toEqual(
        expect.objectContaining({ autoHeightRowCount: 10 }),
      );
    });

    it("converts to Fixed height in auto layout", () => {
      expect(TableWidgetV2.getAutoLayoutConfig().disabledPropsDefaults).toEqual(
        { dynamicHeight: DynamicHeight.FIXED },
      );
    });
  });

  describe("getWidgetView", () => {
    it("does not enable auto height rendering for fixed height tables", () => {
      const props = getTableComponentProps({});

      expect(props.isAutoHeightEnabled).toBe(false);
      // Without header options a fixed table shows one extra row
      expect(props.pageSize).toBe(6);
    });

    it.each([DynamicHeight.AUTO_HEIGHT, DynamicHeight.AUTO_HEIGHT_WITH_LIMITS])(
      "enables auto height rendering for %s",
      (dynamicHeight) => {
        const props = getTableComponentProps({ dynamicHeight });

        expect(props.isAutoHeightEnabled).toBe(true);
        // Rows per page is shown exactly, with or without header options
        expect(props.pageSize).toBe(5);
      },
    );

    it("does not enable auto height rendering for auto layout children", () => {
      const props = getTableComponentProps({
        dynamicHeight: DynamicHeight.AUTO_HEIGHT,
        isFlexChild: true,
      });

      expect(props.isAutoHeightEnabled).toBe(false);
    });
  });

  describe("componentDidMount", () => {
    const mount = (props: Partial<TableWidgetProps>) => {
      const widget = new TableWidgetV2({ ...baseProps, ...props });
      const batchUpdateWidgetProperty = jest
        .spyOn(widget, "batchUpdateWidgetProperty")
        .mockImplementation(jest.fn());

      widget.componentDidMount();

      return batchUpdateWidgetProperty;
    };

    it("turns infinite scroll off when a table loads with auto height and infinite scroll both on", () => {
      const batchUpdateWidgetProperty = mount({
        dynamicHeight: DynamicHeight.AUTO_HEIGHT,
        infiniteScrollEnabled: true,
      });

      expect(batchUpdateWidgetProperty).toHaveBeenCalledTimes(1);
      expect(batchUpdateWidgetProperty).toHaveBeenCalledWith(
        { modify: expect.objectContaining({ infiniteScrollEnabled: false }) },
        false,
      );
    });

    it("leaves infinite scroll alone for fixed height tables", () => {
      expect(mount({ infiniteScrollEnabled: true })).not.toHaveBeenCalled();
    });

    it("does not write widget properties outside the editor", () => {
      expect(
        mount({
          dynamicHeight: DynamicHeight.AUTO_HEIGHT,
          infiniteScrollEnabled: true,
          renderMode: RenderModes.PAGE,
        }),
      ).not.toHaveBeenCalled();
    });
  });

  describe("componentDidUpdate", () => {
    const update = (
      prevProps: Partial<TableWidgetProps>,
      nextProps: Partial<TableWidgetProps>,
    ) => {
      const widget = new TableWidgetV2({ ...baseProps, ...nextProps });
      const batchUpdateWidgetProperty = jest
        .spyOn(widget, "batchUpdateWidgetProperty")
        .mockImplementation(jest.fn());

      widget.componentDidUpdate({ ...baseProps, ...prevProps });

      return batchUpdateWidgetProperty;
    };

    it("turns infinite scroll off when the height switches to auto in the editor", () => {
      const batchUpdateWidgetProperty = update(
        { dynamicHeight: DynamicHeight.FIXED, infiniteScrollEnabled: true },
        {
          dynamicHeight: DynamicHeight.AUTO_HEIGHT,
          infiniteScrollEnabled: true,
        },
      );

      expect(batchUpdateWidgetProperty).toHaveBeenCalledWith(
        {
          modify: expect.objectContaining({
            infiniteScrollEnabled: false,
            isVisibleSearch: true,
            isVisibleFilters: true,
            isSortable: true,
          }),
        },
        false,
      );
    });

    it("turns infinite scroll off only once, on the switch to auto", () => {
      const batchUpdateWidgetProperty = update(
        {
          dynamicHeight: DynamicHeight.AUTO_HEIGHT,
          infiniteScrollEnabled: true,
        },
        {
          dynamicHeight: DynamicHeight.AUTO_HEIGHT,
          infiniteScrollEnabled: true,
        },
      );

      expect(batchUpdateWidgetProperty).not.toHaveBeenCalled();
    });

    it("leaves infinite scroll alone when the height stays fixed", () => {
      const batchUpdateWidgetProperty = update(
        { infiniteScrollEnabled: true },
        { infiniteScrollEnabled: true },
      );

      expect(batchUpdateWidgetProperty).not.toHaveBeenCalledWith(
        expect.objectContaining({
          modify: expect.objectContaining({ infiniteScrollEnabled: false }),
        }),
        expect.anything(),
      );
    });

    it("does not write widget properties outside the editor", () => {
      const batchUpdateWidgetProperty = update(
        { dynamicHeight: DynamicHeight.FIXED, infiniteScrollEnabled: true },
        {
          dynamicHeight: DynamicHeight.AUTO_HEIGHT,
          infiniteScrollEnabled: true,
          renderMode: RenderModes.PAGE,
        },
      );

      expect(batchUpdateWidgetProperty).not.toHaveBeenCalled();
    });
  });
});
