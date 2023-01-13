import React, { Component } from "react";
import { AppState } from "@appsmith/reducers";
import { connect } from "react-redux";
import { Placement } from "popper.js";
import * as Sentry from "@sentry/react";
import _, { toString } from "lodash";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledPropertyPaneButton } from "./StyledControls";
import styled from "constants/DefaultTheme";
import { Indices } from "constants/Layers";
import { Size, Category } from "design-system";
import EmptyDataState from "components/utils/EmptyDataState";
import EvaluatedValuePopup from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import {
  createColumn,
  isColumnTypeEditable,
  reorderColumns,
} from "widgets/TableWidgetV2/widget/utilities";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  getDataTreeForAutocomplete,
  getPathEvalErrors,
} from "selectors/dataTreeSelectors";
import {
  EvaluationError,
  getEvalValuePath,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";
import { Checkbox, CheckboxType } from "design-system";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { Colors } from "constants/Colors";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";

const TabsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const AddColumnButton = styled(StyledPropertyPaneButton)`
  width: 100%;
  display: flex;
  justify-content: center;
  &&&& {
    margin-top: 12px;
    margin-bottom: 8px;
  }
`;

const EdtiableCheckboxWrapper = styled.div<{ rightPadding: boolean | null }>`
  position: relative;
  ${(props) => props.rightPadding && `right: 6px;`}
`;

interface ReduxStateProps {
  dynamicData: DataTree;
  datasources: any;
  errors: EvaluationError[];
}
interface EvaluatedValueProps {
  isFocused: boolean;
  theme: EditorTheme;
  popperPlacement?: Placement;
  popperZIndex?: Indices;
  dataTreePath?: string;
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

type State = {
  focusedIndex: number | null;
  duplicateColumnIds: string[];
  hasEditableColumn: boolean;
  hasScrollableList: boolean;
};

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
      hasEditableColumn: false,
      hasScrollableList: false,
    };
  }

  componentDidMount() {
    this.checkAndUpdateIfEditableColumnPresent();
  }

  componentDidUpdate(prevProps: ControlProps): void {
    //on adding a new column last column should get focused
    if (
      Object.keys(prevProps.propertyValue).length + 1 ===
      Object.keys(this.props.propertyValue).length
    ) {
      this.updateFocus(Object.keys(this.props.propertyValue).length - 1, true);
      this.checkAndUpdateIfEditableColumnPresent();
    }

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
  }

  render() {
    // Get columns from widget properties
    const columns: ColumnsType = this.props.propertyValue || {};

    // If there are no columns, show empty state
    if (Object.keys(columns).length === 0) {
      return <EmptyDataState />;
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
          {this.state.hasEditableColumn && (
            <EdtiableCheckboxWrapper
              className="flex t--uber-editable-checkbox"
              rightPadding={this.state.hasScrollableList}
            >
              <span className="mr-2">Editable</span>
              <Checkbox
                backgroundColor={Colors.GREY_600}
                isDefaultChecked={this.isAllColumnsEditable()}
                label=""
                onCheckChange={this.toggleAllColumnsEditability}
                type={CheckboxType.SECONDARY}
              />
            </EdtiableCheckboxWrapper>
          )}
        </div>
        <TabsWrapper>
          <EvaluatedValuePopupWrapper {...this.props} isFocused={isFocused}>
            <DraggableListControl
              className={LIST_CLASSNAME}
              deleteOption={this.deleteOption}
              fixedHeight={370}
              focusedIndex={this.state.focusedIndex}
              itemHeight={45}
              items={draggableComponentColumns}
              onEdit={this.onEdit}
              propertyPath={this.props.dataTreePath}
              renderComponent={(props: any) =>
                DraggableListCard({
                  ...props,
                  showCheckbox: true,
                  placeholder: "Column Title",
                })
              }
              toggleCheckbox={this.toggleCheckbox}
              toggleVisibility={this.toggleVisibility}
              updateFocus={this.updateFocus}
              updateItems={this.updateItems}
              updateOption={this.updateOption}
            />
          </EvaluatedValuePopupWrapper>

          <AddColumnButton
            category={Category.secondary}
            className="t--add-column-btn"
            icon="plus"
            onClick={this.addNewColumn}
            size={Size.medium}
            tag="button"
            text="Add a new column"
            type="button"
          />
        </TabsWrapper>
      </>
    );
  }

  addNewColumn = () => {
    const column = createColumn(this.props.widgetProperties, "customColumn");

    this.updateProperty(`${this.props.propertyName}.${column.id}`, column);
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

  toggleCheckbox = (index: number, checked: boolean) => {
    const columns: ColumnsType = this.props.propertyValue || {};
    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    if (originalColumn) {
      this.updateProperty(
        `${this.props.propertyName}.${originalColumn.id}.isEditable`,
        checked,
      );

      /*
       * Check whether isCellEditable property of the column has dynamic value
       * if not, toggle isCellEditable value as well. We're doing this to smooth
       * the user experience.
       */
      if (!isDynamicValue(toString(originalColumn.isCellEditable))) {
        this.updateProperty(
          `${this.props.propertyName}.${originalColumn.id}.isCellEditable`,
          checked,
        );
      }
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

    Object.values(columns).forEach((column) => {
      if (isColumnTypeEditable(column.columnType) && !column.isDerived) {
        this.updateProperty(
          `${this.props.propertyName}.${column.id}.isEditable`,
          !isEditable,
        );

        /*
         * Check whether isCellEditable property of the column has dynamic value.
         * if not, toggle isCellEditable value as well. We're doing this to smooth
         * the user experience.
         */
        if (!isDynamicValue(toString(column.isCellEditable))) {
          this.updateProperty(
            `${this.props.propertyName}.${column.id}.isCellEditable`,
            !isEditable,
          );
        }
      }
    });

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

  checkAndUpdateIfEditableColumnPresent = () => {
    const hasEditableColumn = !!Object.values(
      this.props.propertyValue,
    ).find((column) =>
      isColumnTypeEditable((column as ColumnProperties).columnType),
    );

    if (hasEditableColumn !== this.state.hasEditableColumn) {
      this.setState({
        hasEditableColumn,
      });
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
class EvaluatedValuePopupWrapperClass extends Component<
  EvaluatedValuePopupWrapperProps
> {
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

    const pathEvaluatedValue = _.get(dataTree, getEvalValuePath(dataTreePath));

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
    const {
      errors,
      isInvalid,
      pathEvaluatedValue,
    } = this.getPropertyValidation(dynamicData, dataTreePath);
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
