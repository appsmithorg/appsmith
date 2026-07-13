import {
  compileSelectedRowBinding,
  type WidgetSpec,
  type WidgetType,
} from "./schema.js";

// Curated widget templates. Each maps a high-level spec widget to a valid Appsmith DSL node: the Appsmith widget
// `type`, its DSL `version`, a default grid footprint (in 64-column grid units), the base default props, and a
// per-widget builder that folds in the spec-provided values (text, label, data, ...).
//
// Defaults are a trimmed subset of the client's getDefaults() blobs — enough structural props to render. They are
// intentionally small; the fixture drift test guards against the import schema moving underneath us.

export interface WidgetFootprint {
  columns: number; // width in 64-col grid units
  rows: number; // height in grid rows (each row = 10px)
}

export interface BuiltWidget {
  props: Record<string, unknown>;
  footprint: WidgetFootprint;
  // Present only for container: the child specs to compile into the inner canvas.
  children?: WidgetSpec[];
}

export interface WidgetTemplate {
  appsmithType: string;
  version: number;
  footprint: WidgetFootprint;
  build: (spec: WidgetSpec) => BuiltWidget;
}

export const WIDGET_TEMPLATES: Record<WidgetType, WidgetTemplate> = {
  text: {
    appsmithType: "TEXT_WIDGET",
    version: 1,
    footprint: { columns: 24, rows: 4 },
    build: (spec) => {
      const source = spec.type === "text" ? spec.source : undefined;
      const staticText = spec.type === "text" ? spec.text : undefined;

      if (source !== undefined && staticText !== undefined) {
        throw new Error("text cannot set both 'text' and 'source'");
      }

      // Two safe origins: a static literal, or a compiler-emitted selected-row binding (detail views). The binding
      // is registered as a dynamic path; the static literal never is.
      const bound = source !== undefined;
      const text = bound
        ? compileSelectedRowBinding(source)
        : staticText ?? "Text";

      return {
        footprint: { columns: 24, rows: 4 },
        props: {
          text,
          fontSize: "1rem",
          fontStyle: "BOLD",
          textAlign: "LEFT",
          textColor: "#231F20",
          shouldTruncate: false,
          overflow: "NONE",
          animateLoading: true,
          responsiveBehavior: "fill",
          dynamicBindingPathList: bound ? [{ key: "text" }] : [],
        },
      };
    },
  },

  input: {
    appsmithType: "INPUT_WIDGET_V2",
    version: 2,
    footprint: { columns: 24, rows: 7 },
    build: (spec) => {
      const label = spec.type === "input" ? spec.label ?? "Label" : "Label";
      const inputType =
        spec.type === "input" ? spec.inputType ?? "TEXT" : "TEXT";
      const defaultValue =
        spec.type === "input" ? spec.defaultValue : undefined;

      // Edit-form prefill: a compiler-emitted selected-row binding as the default value, registered as a dynamic
      // path. Unbound inputs keep a plain empty default.
      const bound = defaultValue !== undefined;
      const defaultText = bound ? compileSelectedRowBinding(defaultValue) : "";

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          label,
          inputType,
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          labelWidth: 5,
          defaultText,
          isRequired: false,
          isDisabled: false,
          resetOnSubmit: true,
          showStepArrows: false,
          animateLoading: true,
          responsiveBehavior: "fill",
          dynamicBindingPathList: bound ? [{ key: "defaultText" }] : [],
        },
      };
    },
  },

  select: {
    appsmithType: "SELECT_WIDGET",
    version: 1,
    footprint: { columns: 24, rows: 7 },
    build: (spec) => {
      const label = spec.type === "select" ? spec.label ?? "Label" : "Label";
      const options =
        spec.type === "select" && spec.options
          ? spec.options
          : [
              { label: "Option 1", value: "1" },
              { label: "Option 2", value: "2" },
            ];

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          label,
          options,
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          isRequired: false,
          isDisabled: false,
          isFilterable: true,
          serverSideFiltering: false,
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  button: {
    appsmithType: "BUTTON_WIDGET",
    version: 1,
    footprint: { columns: 16, rows: 4 },
    build: (spec) => {
      const text = spec.type === "button" ? spec.text ?? "Submit" : "Submit";
      const run = spec.type === "button" ? spec.onClick?.run : undefined;

      // M4: a bound onClick runs a named query via the closed vocabulary (`{{ <query>.run() }}`), registered as a
      // dynamic trigger. Unbound, onClick is an inert stub (empty, no trigger path) — nothing is evaluated.
      const onClick = run !== undefined ? `{{ ${run}.run() }}` : "";

      return {
        footprint: { columns: 16, rows: 4 },
        props: {
          text,
          buttonVariant: "PRIMARY",
          placement: "CENTER",
          isDisabled: false,
          isDefaultClickDisabled: true,
          recaptchaType: "V3",
          onClick,
          dynamicTriggerPathList: run !== undefined ? [{ key: "onClick" }] : [],
          animateLoading: true,
          responsiveBehavior: "hug",
        },
      };
    },
  },

  image: {
    appsmithType: "IMAGE_WIDGET",
    version: 1,
    footprint: { columns: 16, rows: 24 },
    build: (spec) => {
      const image = spec.type === "image" ? spec.image ?? "" : "";

      return {
        footprint: { columns: 16, rows: 24 },
        props: {
          image,
          defaultImage: "https://assets.appsmith.com/widgets/default.png",
          imageShape: "RECTANGLE",
          maxZoomLevel: 1,
          objectFit: "cover",
          enableRotation: false,
          enableDownload: false,
          animateLoading: true,
        },
      };
    },
  },

  table: {
    appsmithType: "TABLE_WIDGET_V2",
    version: 2,
    footprint: { columns: 40, rows: 28 },
    build: (spec) => {
      const rows = spec.type === "table" ? spec.data ?? [] : [];
      const source = spec.type === "table" ? spec.source : undefined;

      if (source !== undefined && rows.length > 0) {
        throw new Error("table cannot set both 'data' and 'source'");
      }

      // Two safe data origins: (1) static literal rows serialized as JSON with NO binding, or (2) a query source
      // compiled to `{{ <query>.data }}` (optionally into a nested field, e.g. `.data.places`) from the closed
      // vocabulary. Query name and field path are strict identifier paths, so the expression cannot be broken out
      // of. Agents never author raw expression text either way.
      const bound = source !== undefined;
      const tableData = bound
        ? `{{ ${source.query}.data${source.field ? `.${source.field}` : ""} }}`
        : rows.length > 0
          ? JSON.stringify(rows)
          : "";

      return {
        footprint: { columns: 40, rows: 28 },
        props: {
          tableData,
          primaryColumns: {},
          columnOrder: [],
          columnWidthMap: {},
          label: "Data",
          searchKey: "",
          defaultSelectedRowIndex: 0,
          defaultSelectedRowIndices: [0],
          textSize: "0.875rem",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          totalRecordsCount: 0,
          defaultPageSize: 0,
          borderColor: "#E0DEDE",
          borderWidth: "1",
          enableClientSideSearch: true,
          isVisibleSearch: true,
          isVisibleFilters: false,
          isVisibleDownload: true,
          isVisiblePagination: true,
          isSortable: true,
          delimiter: ",",
          inlineEditingSaveOption: "ROW_LEVEL",
          animateLoading: true,
          responsiveBehavior: "fill",
          // A query source is a real dynamic binding; static rows are not.
          dynamicBindingPathList: bound ? [{ key: "tableData" }] : [],
          dynamicPropertyPathList: [],
        },
      };
    },
  },

  container: {
    appsmithType: "CONTAINER_WIDGET",
    version: 1,
    footprint: { columns: 40, rows: 30 },
    build: (spec) => {
      const children = spec.type === "container" ? spec.children ?? [] : [];

      return {
        footprint: { columns: 40, rows: 30 },
        children,
        props: {
          backgroundColor: "#FFFFFF",
          containerStyle: "card",
          borderColor: "#E0DEDE",
          borderWidth: "1",
          boxShadow: "NONE",
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  form: {
    appsmithType: "FORM_WIDGET",
    version: 1,
    footprint: { columns: 40, rows: 34 },
    build: (spec) => {
      const fields = spec.type === "form" ? spec.children ?? [] : [];
      const submitLabel =
        spec.type === "form" ? spec.submitLabel ?? "Submit" : "Submit";

      // A form is a container that ends with a submit button. The synthetic button is a real child spec, compiled
      // like any other widget; its onClick stays an inert stub until the data layer wires submission.
      const children: WidgetSpec[] = [
        ...fields,
        { type: "button", text: submitLabel },
      ];

      return {
        footprint: { columns: 40, rows: 34 },
        children,
        props: {
          backgroundColor: "#FFFFFF",
          borderColor: "#E0DEDE",
          borderWidth: "1",
          boxShadow: "NONE",
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  modal: {
    appsmithType: "MODAL_WIDGET",
    version: 2,
    footprint: { columns: 32, rows: 24 },
    build: (spec) => {
      const children = spec.type === "modal" ? spec.children ?? [] : [];
      const title = spec.type === "modal" ? spec.title ?? "Modal" : "Modal";

      return {
        footprint: { columns: 32, rows: 24 },
        children,
        props: {
          canOutsideClickClose: true,
          canEscapeKeyClose: true,
          shouldScrollContents: true,
          size: "MODAL_SMALL",
          width: 456,
          height: 252,
          title,
          animateLoading: true,
          detachFromLayout: true,
        },
      };
    },
  },

  datepicker: {
    appsmithType: "DATE_PICKER_WIDGET2",
    version: 2,
    footprint: { columns: 20, rows: 7 },
    build: (spec) => {
      const label = spec.type === "datepicker" ? spec.label ?? "Date" : "Date";

      return {
        footprint: { columns: 20, rows: 7 },
        props: {
          label,
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          dateFormat: "YYYY-MM-DD HH:mm",
          isRequired: false,
          isDisabled: false,
          minDate: "1920-12-31T18:30:00.000Z",
          maxDate: "2121-12-31T18:29:00.000Z",
          firstDayOfWeek: 0,
          timePrecision: "minute",
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  chart: {
    appsmithType: "CHART_WIDGET",
    version: 1,
    footprint: { columns: 24, rows: 32 },
    build: (spec) => {
      const title = spec.type === "chart" ? spec.title ?? "Chart" : "Chart";
      const chartType =
        spec.type === "chart" ? spec.chartType ?? "LINE_CHART" : "LINE_CHART";
      const series = spec.type === "chart" ? spec.series ?? [] : [];

      // Static chartData: { <seriesId>: { seriesName, data: [{x,y}] } }. No binding — the points are literals.
      const chartData: Record<string, unknown> = {};

      series.forEach((oneSeries, index) => {
        chartData[`series${index + 1}`] = {
          seriesName: oneSeries.name ?? `Series ${index + 1}`,
          data: (oneSeries.points ?? []).map((point) => ({
            x: point.x,
            y: point.y,
          })),
        };
      });

      return {
        footprint: { columns: 24, rows: 32 },
        props: {
          chartType,
          chartName: title,
          allowScroll: false,
          chartData,
          xAxisName: "",
          yAxisName: "",
          labelOrientation: "auto",
          setAdaptiveYMin: false,
          animateLoading: true,
          responsiveBehavior: "fill",
          dynamicBindingPathList: [],
        },
      };
    },
  },

  list: {
    appsmithType: "LIST_WIDGET_V2",
    version: 3,
    footprint: { columns: 40, rows: 30 },
    build: (spec) => {
      // The children are the repeating item template; they compile into the list's inner canvas.
      const children = spec.type === "list" ? spec.children ?? [] : [];

      return {
        footprint: { columns: 40, rows: 30 },
        children,
        props: {
          listData: [],
          currentItemsView: "[]",
          pageSize: 3,
          serverSidePagination: false,
          animateLoading: true,
          responsiveBehavior: "fill",
          dynamicBindingPathList: [],
          dynamicTriggerPathList: [],
        },
      };
    },
  },

  tabs: {
    appsmithType: "TABS_WIDGET",
    version: 3,
    footprint: { columns: 40, rows: 32 },
    // Tabs is multi-canvas (one inner canvas per tab); the compiler builds its structure directly rather than via
    // the single-inner-canvas container path. This template supplies only type/version/footprint + base props.
    build: () => ({
      footprint: { columns: 40, rows: 32 },
      props: {
        shouldShowTabs: true,
        animateLoading: true,
        responsiveBehavior: "fill",
      },
    }),
  },
};
