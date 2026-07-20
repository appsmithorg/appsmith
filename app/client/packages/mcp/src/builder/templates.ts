import {
  compileChartDataBinding,
  compileInputValidation,
  compileComputedValue,
  compileQueryFieldBinding,
  compileSelectedRowBinding,
  compileTableDataBinding,
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
      const value = spec.type === "text" ? spec.value : undefined;

      if (source !== undefined && staticText !== undefined) {
        throw new Error("text cannot set both 'text' and 'source'");
      }

      if (
        value !== undefined &&
        (source !== undefined || staticText !== undefined)
      ) {
        throw new Error(
          "text cannot set 'value' together with 'text' or 'source'",
        );
      }

      // Four safe origins: a static literal, a compiler-emitted selected-row binding (detail views), a
      // compiler-emitted query-field binding (scalar readouts), or a compiler-emitted computed value (dates,
      // counts, concat). Bindings are registered as dynamic paths; the static literal never is. The strict ref
      // shapes discriminate by key ("table" vs "query").
      const bound = source !== undefined || value !== undefined;
      const text =
        value !== undefined
          ? compileComputedValue(value)
          : source === undefined
            ? staticText ?? "Text"
            : "table" in source
              ? compileSelectedRowBinding(source)
              : compileQueryFieldBinding(source);

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

      // Named-format validation compiles to literal regex + errorMessage props. A validated input is required by
      // default so an empty value is also invalid (otherwise isValid is true when empty).
      const validation = spec.type === "input" ? spec.validation : undefined;
      const validationProps = validation
        ? compileInputValidation(validation)
        : undefined;

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
          isRequired: validationProps !== undefined,
          isDisabled: false,
          resetOnSubmit: true,
          showStepArrows: false,
          animateLoading: true,
          responsiveBehavior: "fill",
          ...(validationProps ?? {}),
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
      const optionsSource =
        spec.type === "select" ? spec.optionsSource : undefined;
      const staticOptions = spec.type === "select" ? spec.options : undefined;

      if (optionsSource !== undefined && staticOptions !== undefined) {
        throw new Error("select cannot set both 'options' and 'optionsSource'");
      }

      // Two safe origins for the dropdown's data:
      // (1) STATIC: a JSON-serialized array of {label,value} (no binding — JSON.stringify escapes the agent's safe
      //     text/scalars, so the array literal is inert), keyed by the literal "label"/"value" props.
      // (2) QUERY source: `sourceData` compiled to `{{ <query>.data ?? [] }}` (reusing the table-data emitter, whose
      //     query/field are strict identifier paths) and registered as a dynamic binding; optionLabel/optionValue are
      //     validated column-name LITERALS (charset admits no quote/brace/backtick), so they cannot become bindings.
      const bound = optionsSource !== undefined;
      const options = staticOptions ?? [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
      ];
      const sourceData = bound
        ? compileTableDataBinding({
            query: optionsSource.query,
            field: optionsSource.field,
          })
        : JSON.stringify(options);
      const optionLabel = bound ? optionsSource.label : "label";
      const optionValue = bound ? optionsSource.value : "value";

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          label,
          // SELECT_WIDGET derives its dropdown from `sourceData` (a JS-evaluated array) keyed by
          // optionLabel/optionValue — NOT the legacy `options` prop.
          sourceData,
          optionLabel,
          optionValue,
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          isRequired: false,
          isDisabled: false,
          isFilterable: true,
          serverSideFiltering: false,
          animateLoading: true,
          responsiveBehavior: "fill",
          // sourceData is a JS-toggled property either way; a query source additionally holds a `{{ }}` binding, so it
          // is registered in dynamicBindingPathList (eval evaluates it) as well as dynamicPropertyPathList (JS mode).
          dynamicPropertyPathList: [{ key: "sourceData" }],
          dynamicBindingPathList: bound ? [{ key: "sourceData" }] : [],
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
      const source = spec.type === "image" ? spec.source : undefined;
      const staticImage = spec.type === "image" ? spec.image : undefined;

      if (source !== undefined && staticImage !== undefined) {
        throw new Error("image cannot set both 'image' and 'source'");
      }

      // Two safe origins, mirroring text: a static literal URL, or a compiler-emitted query-field binding
      // registered as a dynamic path.
      const bound = source !== undefined;
      const image = bound
        ? compileQueryFieldBinding(source)
        : staticImage ?? "";

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
          dynamicBindingPathList: bound ? [{ key: "image" }] : [],
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
      // compiled to a binding into the query's response (optionally a nested field, e.g. `.data.places`) from the
      // closed vocabulary. Query name and field path are strict identifier paths, so the expression cannot be broken
      // out of. Agents never author raw expression text either way. Optional chaining + `?? []` keeps the table valid
      // before the query has run (data undefined), avoiding a "Data is undefined" widget error.
      const bound = source !== undefined;
      const tableData = bound
        ? compileTableDataBinding(source)
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
      const source = spec.type === "chart" ? spec.source : undefined;
      const series = spec.type === "chart" ? spec.series ?? [] : [];

      if (source !== undefined && series.length > 0) {
        throw new Error("chart cannot set both 'series' and 'source'");
      }

      // Two safe data origins for CHART_WIDGET's `chartData` (an object keyed by series id, each `{ seriesName, data }`):
      // (1) STATIC series: the points are literals — no binding.
      // (2) QUERY source: a single series whose `data` is a compiler-authored map of the query's rows to {x,y}. Only
      //     the series' `data` is a binding, so it is registered at path `chartData.series1.data` (the widget's own
      //     binding-path format, see ChartWidget getPropertyPaneConfig). Query name, response field, and the x/y
      //     column names are all schema-validated charsets, so the emitted expression cannot be broken out of.
      const chartData: Record<string, unknown> = {};

      if (source !== undefined) {
        chartData.series1 = {
          seriesName: title,
          data: compileChartDataBinding(source),
        };
      } else {
        series.forEach((oneSeries, index) => {
          chartData[`series${index + 1}`] = {
            seriesName: oneSeries.name ?? `Series ${index + 1}`,
            data: (oneSeries.points ?? []).map((point) => ({
              x: point.x,
              y: point.y,
            })),
          };
        });
      }

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
          // A query source's series data is a real dynamic binding; static points are not.
          dynamicBindingPathList:
            source !== undefined ? [{ key: "chartData.series1.data" }] : [],
        },
      };
    },
  },

  list: {
    appsmithType: "LIST_WIDGET_V2",
    version: 3,
    footprint: { columns: 40, rows: 30 },
    // List Widget V2 is a curated card grid whose 4-level DSL (list -> main canvas -> item container -> inner canvas
    // -> template widgets) with cross-referenced ids and compiler-authored per-item bindings can't be expressed by
    // the single-inner-canvas container path. The compiler builds it directly (see compileCardWidget); this template
    // supplies only the base props shared by every card grid.
    build: () => ({
      footprint: { columns: 40, rows: 30 },
      props: {
        gridType: "vertical",
        itemSpacing: 8,
        backgroundColor: "transparent",
        itemBackgroundColor: "#FFFFFF",
        currentItemsView: "{{[]}}",
        selectedItemView: "{{{}}}",
        triggeredItemView: "{{{}}}",
        isCanvas: true,
        hasMetaWidgets: true,
        requiresFlatWidgetChildren: true,
        additionalStaticProps: [
          "level",
          "levelData",
          "prefixMetaWidgetId",
          "metaWidgetId",
        ],
        serverSidePagination: false,
        animateLoading: true,
        responsiveBehavior: "fill",
        minWidth: 450,
        dynamicTriggerPathList: [],
      },
    }),
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

  checkbox: {
    appsmithType: "CHECKBOX_WIDGET",
    version: 1,
    footprint: { columns: 12, rows: 4 },
    build: (spec) => {
      const label = spec.type === "checkbox" ? spec.label ?? "Label" : "Label";
      // Matches CHECKBOX_WIDGET.getDefaults (defaultCheckedState: true). A plain boolean literal — never a binding.
      const defaultCheckedState =
        spec.type === "checkbox" ? spec.defaultChecked ?? true : true;

      return {
        footprint: { columns: 12, rows: 4 },
        props: {
          label,
          defaultCheckedState,
          alignWidget: "LEFT",
          labelPosition: "Left",
          isDisabled: false,
          isRequired: false,
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  switch: {
    appsmithType: "SWITCH_WIDGET",
    version: 1,
    footprint: { columns: 12, rows: 4 },
    build: (spec) => {
      const label = spec.type === "switch" ? spec.label ?? "Label" : "Label";
      // Matches SWITCH_WIDGET.getDefaults (defaultSwitchState: true). A plain boolean literal — never a binding.
      const defaultSwitchState =
        spec.type === "switch" ? spec.defaultChecked ?? true : true;

      return {
        footprint: { columns: 12, rows: 4 },
        props: {
          label,
          defaultSwitchState,
          alignWidget: "LEFT",
          labelPosition: "Left",
          isDisabled: false,
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  radio: {
    appsmithType: "RADIO_GROUP_WIDGET",
    version: 1,
    footprint: { columns: 20, rows: 6 },
    build: (spec) => {
      const label = spec.type === "radio" ? spec.label ?? "Label" : "Label";
      const staticOptions = spec.type === "radio" ? spec.options : undefined;
      const options = staticOptions ?? [
        { label: "Yes", value: "Y" },
        { label: "No", value: "N" },
      ];

      // RADIO_GROUP_WIDGET stores its choices in the plain `options` array (JS mode off — no dynamicPropertyPathList),
      // so static options are a literal array of validated {label,value} scalars — never registered as a binding.
      // `defaultOptionValue` pre-selects the first option (mirrors getDefaults' defaultOptionValue).
      return {
        footprint: { columns: 20, rows: 6 },
        props: {
          label,
          options,
          defaultOptionValue: options.length > 0 ? options[0].value : "",
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          labelWidth: 5,
          isRequired: false,
          isDisabled: false,
          isInline: true,
          alignment: "left",
          animateLoading: true,
        },
      };
    },
  },

  multiselect: {
    appsmithType: "MULTI_SELECT_WIDGET_V2",
    version: 1,
    footprint: { columns: 20, rows: 7 },
    build: (spec) => {
      const label =
        spec.type === "multiselect" ? spec.label ?? "Label" : "Label";
      const staticOptions =
        spec.type === "multiselect" ? spec.options : undefined;
      const options = staticOptions ?? [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
      ];

      // Unlike SELECT_WIDGET (whose sourceData defaults to a JS-evaluated STRING registered in
      // dynamicPropertyPathList), MULTI_SELECT_WIDGET_V2.getDefaults keeps sourceData as a PLAIN array (JS mode off).
      // So static options are a literal array keyed by literal optionLabel/optionValue — NO dynamicPropertyPathList,
      // no binding. MULTI_SELECT also uses `labelText` (not `label`) for its caption.
      return {
        footprint: { columns: 20, rows: 7 },
        props: {
          labelText: label,
          sourceData: options,
          optionLabel: "label",
          optionValue: "value",
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          labelWidth: 5,
          isFilterable: true,
          serverSideFiltering: false,
          isRequired: false,
          isDisabled: false,
          placeholderText: "Select option(s)",
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  filepicker: {
    appsmithType: "FILE_PICKER_WIDGET_V2",
    version: 1,
    footprint: { columns: 16, rows: 4 },
    build: (spec) => {
      const label =
        spec.type === "filepicker"
          ? spec.label ?? "Select Files"
          : "Select Files";

      // Mirrors FILE_PICKER_WIDGET_V2.getDefaults' minimal render props. `files`/`selectedFiles` are meta-driven
      // arrays; the literal defaults keep the widget valid before any upload.
      return {
        footprint: { columns: 16, rows: 4 },
        props: {
          label,
          files: [],
          selectedFiles: [],
          allowedFileTypes: [],
          maxNumFiles: 1,
          maxFileSize: 5,
          fileDataType: "Base64",
          dynamicTyping: true,
          isDefaultClickDisabled: true,
          isRequired: false,
          isDisabled: false,
          animateLoading: true,
          responsiveBehavior: "hug",
        },
      };
    },
  },

  divider: {
    appsmithType: "DIVIDER_WIDGET",
    version: 1,
    footprint: { columns: 20, rows: 4 },
    build: (spec) => {
      const orientation =
        spec.type === "divider"
          ? spec.orientation ?? "horizontal"
          : "horizontal";

      return {
        footprint: { columns: 20, rows: 4 },
        props: {
          orientation,
          capType: "nc",
          capSide: 0,
          strokeStyle: "solid",
          dividerColor: "#B3B3B3",
          thickness: 2,
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },

  progress: {
    appsmithType: "PROGRESS_WIDGET",
    version: 1,
    footprint: { columns: 28, rows: 4 },
    build: (spec) => {
      const value = spec.type === "progress" ? spec.value ?? 50 : 50;
      const isIndeterminate =
        spec.type === "progress" ? spec.infinite ?? false : false;

      return {
        footprint: { columns: 28, rows: 4 },
        props: {
          progress: value,
          isIndeterminate,
          fillColor: "#03B365",
          showResult: false,
          counterClosewise: false,
          steps: 1,
          progressType: "LINEAR",
          responsiveBehavior: "fill",
        },
      };
    },
  },

  circularprogress: {
    appsmithType: "CIRCULAR_PROGRESS_WIDGET",
    version: 1,
    footprint: { columns: 16, rows: 17 },
    build: (spec) => {
      const value = spec.type === "circularprogress" ? spec.value ?? 65 : 65;

      return {
        footprint: { columns: 16, rows: 17 },
        props: {
          progress: value,
          counterClockWise: false,
          fillColor: "#03B365",
          showResult: true,
          shouldScroll: false,
          shouldTruncate: false,
          animateLoading: true,
        },
      };
    },
  },

  rate: {
    appsmithType: "RATE_WIDGET",
    version: 1,
    footprint: { columns: 20, rows: 4 },
    build: (spec) => {
      const rate = spec.type === "rate" ? spec : undefined;

      return {
        footprint: { columns: 20, rows: 4 },
        props: {
          maxCount: rate?.max ?? 5,
          defaultRate: rate?.defaultRate ?? 3,
          activeColor: "#FEB811",
          inactiveColor: "#E7E7E7",
          size: "LARGE",
          isRequired: false,
          isAllowHalf: rate?.allowHalf ?? false,
          isDisabled: false,
          isReadOnly: rate?.readOnly ?? false,
          animateLoading: true,
        },
      };
    },
  },

  iconbutton: {
    appsmithType: "ICON_BUTTON_WIDGET",
    version: 1,
    footprint: { columns: 4, rows: 4 },
    build: (spec) => {
      const button = spec.type === "iconbutton" ? spec : undefined;

      return {
        footprint: { columns: 4, rows: 4 },
        props: {
          iconName: button?.icon ?? "plus",
          buttonVariant: button?.variant ?? "PRIMARY",
          isDisabled: false,
          animateLoading: true,
          responsiveBehavior: "hug",
        },
      };
    },
  },
  currencyinput: {
    appsmithType: "CURRENCY_INPUT_WIDGET",
    version: 1,
    footprint: { columns: 24, rows: 7 },
    build: (spec) => {
      const s = spec.type === "currencyinput" ? spec : undefined;
      // A plain numeric default is emitted as a literal defaultText string — never a binding, so no dynamic path.
      const defaultText =
        s?.defaultValue !== undefined ? String(s.defaultValue) : "";

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          label: s?.label ?? "Label",
          placeholderText: s?.placeholder ?? "",
          defaultText,
          decimals: s?.decimals ?? 0,
          defaultCurrencyCode: (s?.currencyCode ?? "USD").toUpperCase(),
          allowCurrencyChange: false,
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          labelWidth: 5,
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
  phoneinput: {
    appsmithType: "PHONE_INPUT_WIDGET",
    version: 1,
    footprint: { columns: 24, rows: 7 },
    build: (spec) => {
      const s = spec.type === "phoneinput" ? spec : undefined;

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          label: s?.label ?? "Label",
          placeholderText: s?.placeholder ?? "",
          defaultText: s?.defaultValue ?? "",
          defaultDialCode: "+1",
          allowDialCodeChange: false,
          allowFormatting: s?.allowFormatting ?? true,
          labelPosition: "Top",
          labelAlignment: "left",
          labelTextSize: "0.875rem",
          labelWidth: 5,
          isRequired: false,
          isDisabled: false,
          resetOnSubmit: true,
          animateLoading: true,
          responsiveBehavior: "fill",
        },
      };
    },
  },
  numberslider: {
    appsmithType: "NUMBER_SLIDER_WIDGET",
    version: 1,
    footprint: { columns: 40, rows: 8 },
    build: (spec) => {
      const s = spec.type === "numberslider" ? spec : undefined;
      const min = s?.min ?? 0;
      const step = s?.step ?? 1;
      // Guard against an inverted/degenerate range (min >= max) so the track is always valid.
      const max = (s?.max ?? 100) > min ? s?.max ?? 100 : min + step;

      return {
        footprint: { columns: 40, rows: 8 },
        props: {
          labelText: s?.label ?? "Percentage",
          min,
          max,
          step,
          defaultValue: s?.defaultValue ?? min,
          // A caller-set min/max makes the fixed 25/50/75 default marks meaningless, so emit none.
          marks: [],
          showMarksLabel: false,
          isVisible: true,
          isDisabled: false,
          tooltipAlwaysOn: false,
          shouldScroll: false,
          shouldTruncate: false,
          labelPosition: "Top",
          labelAlignment: "left",
          sliderSize: "m",
        },
      };
    },
  },
  categoryslider: {
    appsmithType: "CATEGORY_SLIDER_WIDGET",
    version: 1,
    footprint: { columns: 40, rows: 8 },
    build: (spec) => {
      const s = spec.type === "categoryslider" ? spec : undefined;
      const options = s?.options ?? [
        { label: "xs", value: "xs" },
        { label: "sm", value: "sm" },
        { label: "md", value: "md" },
        { label: "lg", value: "lg" },
        { label: "xl", value: "xl" },
      ];
      // Default to a supplied value only when it names a real option; otherwise fall back to the first stop.
      const optionValues = options.map((o) => String(o.value));
      const defaultOptionValue =
        s?.defaultValue !== undefined && optionValues.includes(s.defaultValue)
          ? s.defaultValue
          : optionValues[0];

      return {
        footprint: { columns: 40, rows: 8 },
        props: {
          labelText: s?.label ?? "Size",
          options,
          defaultOptionValue,
          isVisible: true,
          isDisabled: false,
          showMarksLabel: true,
          shouldScroll: false,
          shouldTruncate: false,
          labelPosition: "Top",
          labelAlignment: "left",
          sliderSize: "m",
        },
      };
    },
  },
  rangeslider: {
    appsmithType: "RANGE_SLIDER_WIDGET",
    version: 1,
    footprint: { columns: 40, rows: 8 },
    build: (spec) => {
      const s = spec.type === "rangeslider" ? spec : undefined;
      const min = s?.min ?? 0;
      const step = s?.step ?? 1;
      const max = (s?.max ?? 100) > min ? s?.max ?? 100 : min + step;

      return {
        footprint: { columns: 40, rows: 8 },
        props: {
          labelText: s?.label ?? "Percentage",
          min,
          max,
          minRange: 5,
          step,
          defaultStartValue: s?.defaultStart ?? min,
          defaultEndValue: s?.defaultEnd ?? max,
          marks: [],
          showMarksLabel: false,
          isVisible: true,
          isDisabled: false,
          tooltipAlwaysOn: false,
          shouldScroll: false,
          shouldTruncate: false,
          labelPosition: "Top",
          labelAlignment: "left",
        },
      };
    },
  },
  checkboxgroup: {
    appsmithType: "CHECKBOX_GROUP_WIDGET",
    version: 2,
    footprint: { columns: 24, rows: 7 },
    build: (spec) => {
      const s = spec.type === "checkboxgroup" ? spec : undefined;
      const options = s?.options ?? [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ];
      // Keep only defaults that name a real option value; a stray default would render an orphan checked box.
      const optionValues = new Set(options.map((o) => String(o.value)));
      const defaultSelectedValues = (s?.defaultSelected ?? []).filter((v) =>
        optionValues.has(v),
      );

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          labelText: s?.label ?? "Label",
          options,
          defaultSelectedValues,
          isDisabled: false,
          isInline: s?.inline ?? true,
          isRequired: false,
          isVisible: true,
          labelPosition: "Top",
          labelAlignment: "left",
        },
      };
    },
  },
  switchgroup: {
    appsmithType: "SWITCH_GROUP_WIDGET",
    version: 1,
    footprint: { columns: 24, rows: 7 },
    build: (spec) => {
      const s = spec.type === "switchgroup" ? spec : undefined;
      const options = s?.options ?? [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ];
      const optionValues = new Set(options.map((o) => String(o.value)));
      const defaultSelectedValues = (s?.defaultSelected ?? []).filter((v) =>
        optionValues.has(v),
      );

      return {
        footprint: { columns: 24, rows: 7 },
        props: {
          labelText: s?.label ?? "Label",
          options,
          defaultSelectedValues,
          isDisabled: false,
          isRequired: false,
          isInline: s?.inline ?? true,
          alignment: "left",
          isVisible: true,
          labelPosition: "Top",
          labelAlignment: "left",
        },
      };
    },
  },
};
