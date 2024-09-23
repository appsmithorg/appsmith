import type { AppState } from "ee/reducers";
import * as Sentry from "@sentry/react";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import EvaluatedValuePopup from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";
import type { Indices } from "constants/Layers";
import { Button } from "@appsmith/ads";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import _, { toString as lodashToString } from "lodash";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";
import type { Placement } from "popper.js";
import React, { Component } from "react";
import { connect } from "react-redux";
import {
  getDataTreeForAutocomplete,
  getPathEvalErrors,
} from "selectors/dataTreeSelectors";
import styled from "styled-components";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import {
  StickyType,
  extraSpace,
  itemHeight,
  noOfItemsToDisplay,
} from "widgets/TableWidgetV2/component/Constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import {
  createColumn,
  isColumnTypeEditable,
  reorderColumns,
} from "widgets/TableWidgetV2/widget/utilities";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";

const EmptyStateLabel = styled.div`
  margin: 20px 0px;
  text-align: center;
  color: var(--ads-v2-color-fg);
`;

interface ReduxStateProps {
  dynamicData: DataTree;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasources: any;
  errors: EvaluationError[];
}
interface EvaluatedValueProps {
  isFocused: boolean;
  theme: EditorTheme;
  popperPlacement?: Placement;
  popperZIndex?: Indices;
  dataTreePath?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  hideEvaluatedValue?: boolean;
  useValidationMessage?: boolean;
  children: JSX.Element;
}

type EvaluatedValuePopupWrapperProps = ReduxStateProps & EvaluatedValueProps;

type ColumnsType = Record<string, ColumnProperties>;

const getOriginalColumn = (
  columns: ColumnsType,
  index: number,
  columnOrder?: string[],
): ColumnProperties | undefined => {
  const reorderedColumns = reorderColumns(columns, columnOrder || []);
  const column: ColumnProperties | undefined = Object.values(
    reorderedColumns,
  ).find((column: ColumnProperties) => column.index === index);

  return column;
};

const fixedHeight = itemHeight * noOfItemsToDisplay + extraSpace;

interface State {
  focusedIndex: number | null;
  duplicateColumnIds: string[];
  hasScrollableList: boolean;
}

const LIST_CLASSNAME = "tablewidgetv2-primarycolumn-list";

class PrimaryColumnsControlV2 extends BaseControl<ControlProps, State> {
  constructor(props: ControlProps) {
    super(props);

    const columns: ColumnsType = props.propertyValue || {};
    const columnOrder = Object.keys(columns);
    const reorderedColumns = reorderColumns(columns, columnOrder);
    const tableColumnLabels = _.map(reorderedColumns, "label");
    const duplicateColumnIds = [];

    for (let index = 0; index < tableColumnLabels.length; index++) {
      const currLabel = tableColumnLabels[index] as string;
      const duplicateValueIndex = tableColumnLabels.indexOf(currLabel);

      if (duplicateValueIndex !== index) {
        // get column id from columnOrder index
        duplicateColumnIds.push(reorderedColumns[columnOrder[index]].id);
      }
    }

    this.state = {
      focusedIndex: null,
      duplicateColumnIds,
      hasScrollableList: false,
    };
  }

  componentDidMount(): void {
    this.setHasScrollableList();
  }

  componentDidUpdate(prevProps: ControlProps): void {
    /**
     * On adding a new column the last column should get focused.
     * If frozen columns are present then the focus should be on the newly added column
     */
    if (
      Object.keys(prevProps.propertyValue).length + 1 ===
      Object.keys(this.props.propertyValue).length
    ) {
      const columns = Object.keys(this.props.propertyValue);

      const frozenColumnIndex = Object.keys(prevProps.propertyValue)
        .map((column) => prevProps.propertyValue[column])
        .filter((column) => column.sticky !== StickyType.RIGHT).length;

      this.updateFocus(
        frozenColumnIndex === 0 ? columns.length - 1 : frozenColumnIndex,
        true,
      );
    }

    this.setHasScrollableList();
  }

  render() {
    // Get columns from widget properties
    const columns: ColumnsType = this.props.propertyValue || {};

    // If there are no columns, show empty state
    if (Object.keys(columns).length === 0) {
      return <EmptyStateLabel>Table columns will appear here</EmptyStateLabel>;
    }

    // Get an empty array of length of columns
    let columnOrder: string[] = new Array(Object.keys(columns).length);

    if (this.props.widgetProperties.columnOrder) {
      columnOrder = this.props.widgetProperties.columnOrder;
    } else {
      columnOrder = Object.keys(columns);
    }

    const reorderedColumns = reorderColumns(columns, columnOrder);

    const draggableComponentColumns = Object.values(reorderedColumns).map(
      (column: ColumnProperties) => {
        return {
          label: column.label || "",
          id: column.id,
          isVisible: column.isVisible,
          isDerived:
            column.isDerived && column.columnType !== ColumnTypes.EDIT_ACTIONS,
          index: column.index,
          isDuplicateLabel: _.includes(
            this.state.duplicateColumnIds,
            column.id,
          ),
          isChecked:
            isColumnTypeEditable(column.columnType) && column.isEditable,
          isCheckboxDisabled:
            !isColumnTypeEditable(column.columnType) || column.isDerived,
          isDragDisabled:
            column.sticky === StickyType.LEFT ||
            column.sticky === StickyType.RIGHT,
        };
      },
    );

    const column: ColumnProperties | undefined = Object.values(
      reorderedColumns,
    ).find(
      (column: ColumnProperties) => column.index === this.state.focusedIndex,
    );
    // show popup on duplicate column label input focused
    const isFocused =
      !_.isNull(this.state.focusedIndex) &&
      _.includes(this.state.duplicateColumnIds, column?.id);

    return (
      <>
        <div className="flex pt-2 pb-2 justify-between">
          <div>{Object.values(reorderedColumns).length} columns</div>
        </div>
        <div className="flex flex-col w-full gap-1">
          <EvaluatedValuePopupWrapper {...this.props} isFocused={isFocused}>
            <DraggableListControl
              className={LIST_CLASSNAME}
              deleteOption={this.deleteOption}
              fixedHeight={fixedHeight}
              focusedIndex={this.state.focusedIndex}
              itemHeight={itemHeight}
              items={draggableComponentColumns}
              keyAccessor="id"
              onEdit={this.onEdit}
              propertyPath={this.props.dataTreePath}
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              renderComponent={(props: any) =>
                DraggableListCard({
                  ...props,
                  placeholder: "Column title",
                })
              }
              toggleCheckbox={this.toggleCheckbox}
              toggleVisibility={this.toggleVisibility}
              updateFocus={this.updateFocus}
              updateItems={this.updateItems}
              updateOption={this.updateOption}
            />
          </EvaluatedValuePopupWrapper>
          <Button
            className="self-end t--add-column-btn"
            kind="tertiary"
            onClick={this.addNewColumn}
            size="sm"
            startIcon="plus"
          >
            Add new column
          </Button>
        </div>
      </>
    );
  }

  addNewColumn = () => {
    const column = createColumn(this.props.widgetProperties, "customColumn");

    this.updateProperty(`${this.props.propertyName}.${column.id}`, column);
  };

  setHasScrollableList = () => {
    const listElement = document.querySelector(`.${LIST_CLASSNAME}`);

    requestAnimationFrame(() => {
      const hasScrollableList =
        listElement && listElement?.scrollHeight > listElement?.clientHeight;

      if (hasScrollableList !== this.state.hasScrollableList) {
        this.setState({
          hasScrollableList: !!hasScrollableList,
        });
      }
    });
  };

  onEdit = (index: number) => {
    const columns: ColumnsType = this.props.propertyValue || {};

    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    this.props.openNextPanel({
      ...originalColumn,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };
  //Used to reorder columns
  updateItems = (items: Array<Record<string, unknown>>) => {
    this.updateProperty(
      "columnOrder",
      items.map(({ id }) => id),
    );
  };

  toggleVisibility = (index: number) => {
    const columns: ColumnsType = this.props.propertyValue || {};
    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    if (originalColumn) {
      this.updateProperty(
        `${this.props.propertyName}.${originalColumn.id}.isVisible`,
        !originalColumn.isVisible,
      );
    }
  };

  getToggleColumnEditablityUpdates = (
    column: ColumnProperties,
    propertyName: string,
    checked: boolean,
  ): {
    propertyName: string;
    propertyValue: string;
  }[] => {
    const updates: {
      propertyName: string;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propertyValue: any;
    }[] = [];

    updates.push({
      propertyName: `${propertyName}.${column.id}.isEditable`,
      propertyValue: checked,
    });

    /*
     * Check whether isCellEditable property of the column has dynamic value
     * if not, toggle isCellEditable value as well. We're doing this to smooth
     * the user experience.
     */
    if (!isDynamicValue(lodashToString(column.isCellEditable))) {
      updates.push({
        propertyName: `${propertyName}.${column.id}.isCellEditable`,
        propertyValue: checked,
      });
    }

    return updates;
  };
  toggleCheckbox = (index: number, checked: boolean) => {
    const columns: ColumnsType = this.props.propertyValue || {};
    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    if (originalColumn) {
      this.batchUpdatePropertiesWithAssociatedUpdates(
        this.getToggleColumnEditablityUpdates(
          originalColumn,
          this.props.propertyName,
          checked,
        ),
      );
    }
  };

  deleteOption = (index: number) => {
    const columns: ColumnsType = this.props.propertyValue || {};
    const columnOrder = this.props.widgetProperties.columnOrder || [];

    const originalColumn = getOriginalColumn(columns, index, columnOrder);

    if (originalColumn) {
      const propertiesToDelete = [
        `${this.props.propertyName}.${originalColumn.id}`,
      ];

      const columnOrderIndex = columnOrder.findIndex(
        (column: string) => column === originalColumn.id,
      );

      if (columnOrderIndex > -1)
        propertiesToDelete.push(`columnOrder[${columnOrderIndex}]`);

      this.deleteProperties(propertiesToDelete);
      // if column deleted, clean up duplicateIndexes
      let duplicateColumnIds = [...this.state.duplicateColumnIds];

      duplicateColumnIds = duplicateColumnIds.filter(
        (id) => id !== originalColumn.id,
      );
      this.setState({ duplicateColumnIds });
    }
  };

  updateOption = (index: number, updatedLabel: string) => {
    const columns: ColumnsType = this.props.propertyValue || {};
    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    if (originalColumn) {
      this.updateProperty(
        `${this.props.propertyName}.${originalColumn.id}.label`,
        updatedLabel,
      );
      // check entered label is unique or duplicate
      const tableColumnLabels = _.map(columns, "label");
      let duplicateColumnIds = [...this.state.duplicateColumnIds];

      // if duplicate, add into array
      if (_.includes(tableColumnLabels, updatedLabel)) {
        duplicateColumnIds.push(originalColumn.id);
        this.setState({ duplicateColumnIds });
      } else {
        duplicateColumnIds = duplicateColumnIds.filter(
          (id) => id !== originalColumn.id,
        );
        this.setState({ duplicateColumnIds });
      }
    }
  };

  updateFocus = (index: number, isFocused: boolean) => {
    this.setState({ focusedIndex: isFocused ? index : null });
  };

  isAllColumnsEditable = () => {
    const columns: ColumnsType = this.props.propertyValue || {};

    return !Object.values(columns).find(
      (column) =>
        !column.isEditable &&
        isColumnTypeEditable(column.columnType) &&
        !column.isDerived,
    );
  };

  toggleAllColumnsEditability = () => {
    const isEditable = this.isAllColumnsEditable();
    const columns: ColumnsType = this.props.propertyValue || {};
    //consolidate all column editability updates
    const allUpdates = Object.values(columns)
      .filter(
        (column) =>
          isColumnTypeEditable(column.columnType) && !column.isDerived,
      )
      .flatMap((column) =>
        this.getToggleColumnEditablityUpdates(
          column,
          this.props.propertyName,
          !isEditable,
        ),
      );

    this.batchUpdatePropertiesWithAssociatedUpdates(allUpdates);

    if (isEditable) {
      const columnOrder = this.props.widgetProperties.columnOrder || [];
      const editActionColumn = Object.values(columns).find(
        (column) => column.columnType === ColumnTypes.EDIT_ACTIONS,
      );

      if (editActionColumn) {
        this.deleteOption(columnOrder.indexOf(editActionColumn.id));
      }
    }
  };

  static getControlType() {
    return "PRIMARY_COLUMNS_V2";
  }
}

export default PrimaryColumnsControlV2;

/**
 * wrapper component on dragable primary columns
 * render popup if primary column labels are not unique
 * show unique name error in PRIMARY_COLUMNS
 */
class EvaluatedValuePopupWrapperClass extends Component<EvaluatedValuePopupWrapperProps> {
  getPropertyValidation = (
    dataTree: DataTree,
    dataTreePath?: string,
  ): {
    isInvalid: boolean;
    errors: EvaluationError[];
    pathEvaluatedValue: unknown;
  } => {
    const { errors } = this.props;

    if (!dataTreePath) {
      return {
        isInvalid: false,
        errors: [],
        pathEvaluatedValue: undefined,
      };
    }

    const pathEvaluatedValue = _.get(dataTree, dataTreePath);

    return {
      isInvalid: errors.length > 0,
      errors: errors,
      pathEvaluatedValue,
    };
  };

  render = () => {
    const {
      dataTreePath,
      dynamicData,
      evaluatedValue,
      expected,
      hideEvaluatedValue,
      useValidationMessage,
    } = this.props;
    const { errors, isInvalid, pathEvaluatedValue } =
      this.getPropertyValidation(dynamicData, dataTreePath);
    let evaluated = evaluatedValue;

    if (dataTreePath) {
      evaluated = pathEvaluatedValue;
    }

    return (
      <EvaluatedValuePopup
        errors={errors}
        evaluatedValue={evaluated}
        expected={expected}
        hasError={isInvalid}
        hideEvaluatedValue={hideEvaluatedValue}
        isOpen={this.props.isFocused && isInvalid}
        popperPlacement={this.props.popperPlacement}
        popperZIndex={this.props.popperZIndex}
        theme={this.props.theme || EditorTheme.LIGHT}
        useValidationMessage={useValidationMessage}
      >
        {this.props.children}
      </EvaluatedValuePopup>
    );
  };
}
const mapStateToProps = (
  state: AppState,
  { dataTreePath }: EvaluatedValueProps,
): ReduxStateProps => {
  return {
    dynamicData: getDataTreeForAutocomplete(state),
    datasources: state.entities.datasources,
    errors: dataTreePath ? getPathEvalErrors(state, dataTreePath) : [],
  };
};

const EvaluatedValuePopupWrapper = Sentry.withProfiler(
  connect(mapStateToProps)(EvaluatedValuePopupWrapperClass),
);
