import type { WidgetSpec, WidgetType } from "./schema.js";

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

function bindingPaths(...keys: string[]) {
  return keys.map((key) => ({ key }));
}

export const WIDGET_TEMPLATES: Record<WidgetType, WidgetTemplate> = {
  text: {
    appsmithType: "TEXT_WIDGET",
    version: 1,
    footprint: { columns: 24, rows: 4 },
    build: (spec) => {
      const text = spec.type === "text" ? spec.text ?? "Text" : "Text";

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

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          label,
          inputType,
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          labelWidth: 5,
          defaultText: "",
          isRequired: false,
          isDisabled: false,
          resetOnSubmit: true,
          showStepArrows: false,
          animateLoading: true,
          responsiveBehavior: "fill",
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

      return {
        footprint: { columns: 16, rows: 4 },
        props: {
          text,
          buttonVariant: "PRIMARY",
          placement: "CENTER",
          isDisabled: false,
          isDefaultClickDisabled: true,
          recaptchaType: "V3",
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
      const data = spec.type === "table" ? spec.data ?? "" : "";

      return {
        footprint: { columns: 40, rows: 28 },
        props: {
          tableData: data,
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
          dynamicBindingPathList: data ? bindingPaths("tableData") : [],
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
};
