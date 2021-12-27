import React, { useCallback, useEffect, useState, Component } from "react";
import { AppState } from "reducers";
import { connect } from "react-redux";
import { Placement } from "popper.js";
import * as Sentry from "@sentry/react";
import _ from "lodash";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledDragIcon,
  StyledEditIcon,
  StyledDeleteIcon,
  StyledVisibleIcon,
  StyledHiddenIcon,
  StyledPropertyPaneButton,
  StyledOptionControlInputGroup,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { Indices } from "constants/Layers";
import { DroppableComponent } from "components/ads/DraggableListComponent";
import { Size, Category } from "components/ads/Button";
import EmptyDataState from "components/utils/EmptyDataState";
import EvaluatedValuePopup from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { ColumnProperties } from "widgets/TableWidget/component/Constants";
import {
  getDefaultColumnProperties,
  getTableStyles,
} from "widgets/TableWidget/component/TableUtilities";
import { reorderColumns } from "widgets/TableWidget/component/TableHelpers";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import {
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { getNextEntityName } from "utils/AppsmithUtils";
import { Colors } from "constants/Colors";
import { noop } from "utils/AppsmithUtils";

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  &.has-duplicate-label > div:nth-child(2) {
    border: 1px solid ${Colors.DANGER_SOLID};
  }
`;

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

interface ReduxStateProps {
  dynamicData: DataTree;
  datasources: any;
}

type EvaluatedValuePopupWrapperProps = ReduxStateProps & {
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
};

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
    isDerived?: boolean;
    isVisible?: boolean;
    isDuplicateLabel?: boolean;
  };
  updateFocus?: (index: number, isFocused: boolean) => void;
  updateOption: (index: number, value: string) => void;
  onEdit?: (index: number) => void;
  deleteOption: (index: number) => void;
  toggleVisibility?: (index: number) => void;
};

const getOriginalColumn = (
  columns: Record<string, ColumnProperties>,
  index: number,
  columnOrder?: string[],
): ColumnProperties | undefined => {
  const reorderedColumns = reorderColumns(columns, columnOrder || []);
  const column: ColumnProperties | undefined = Object.values(
    reorderedColumns,
  ).find((column: ColumnProperties) => column.index === index);
  return column;
};

function ColumnControlComponent(props: RenderComponentProps) {
  const [value, setValue] = useState(props.item.label);
  const [isEditing, setEditing] = useState(false);

  useEffect(() => {
    if (!isEditing && props.item && props.item.label)
      setValue(props.item.label);
  }, [props.item?.label, isEditing]);

  const {
    deleteOption,
    index,
    item,
    onEdit,
    toggleVisibility,
    updateFocus,
    updateOption,
  } = props;
  const [visibility, setVisibility] = useState(item.isVisible);
  const debouncedUpdate = _.debounce(updateOption, 1000);
  const debouncedFocus = updateFocus ? _.debounce(updateFocus, 400) : noop;
  const onChange = useCallback(
    (index: number, value: string) => {
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );

  const onFocus = () => {
    setEditing(false);
    debouncedFocus(index, true);
  };
  const onBlur = () => {
    setEditing(false);
    debouncedFocus(index, false);
  };

  return (
    <ItemWrapper
      className={props.item.isDuplicateLabel ? "has-duplicate-label" : ""}
    >
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder="Column Title"
        value={value}
        width="100%"
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={() => {
          onEdit && onEdit(index);
        }}
        width={20}
      />
      {!!item.isDerived ? (
        <StyledDeleteIcon
          className="t--delete-column-btn"
          height={20}
          onClick={() => {
            deleteOption && deleteOption(index);
          }}
          width={20}
        />
      ) : visibility ? (
        <StyledVisibleIcon
          className="t--show-column-btn"
          height={20}
          onClick={() => {
            setVisibility(!visibility);
            toggleVisibility && toggleVisibility(index);
          }}
          width={20}
        />
      ) : (
        <StyledHiddenIcon
          className="t--show-column-btn"
          height={20}
          onClick={() => {
            setVisibility(!visibility);
            toggleVisibility && toggleVisibility(index);
          }}
          width={20}
        />
      )}
    </ItemWrapper>
  );
}

type State = {
  focusedIndex: number | null;
  duplicateColumnIds: string[];
};

class PrimaryColumnsControl extends BaseControl<ControlProps, State> {
  constructor(props: ControlProps) {
    super(props);

    const columns: Record<string, ColumnProperties> = props.propertyValue || {};
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
    };
  }

  render() {
    // Get columns from widget properties
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};

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
          label: column.label,
          id: column.id,
          isVisible: column.isVisible,
          isDerived: column.isDerived,
          index: column.index,
          isDuplicateLabel: _.includes(
            this.state.duplicateColumnIds,
            column.id,
          ),
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
      <TabsWrapper>
        <EvaluatedValuePopupWrapper {...this.props} isFocused={isFocused}>
          <DroppableComponent
            deleteOption={this.deleteOption}
            itemHeight={45}
            items={draggableComponentColumns}
            onEdit={this.onEdit}
            renderComponent={ColumnControlComponent}
            toggleVisibility={this.toggleVisibility}
            updateFocus={this.updateFocus}
            updateItems={this.updateItems}
            updateOption={this.updateOption}
          />
        </EvaluatedValuePopupWrapper>

        <AddColumnButton
          category={Category.tertiary}
          className="t--add-column-btn"
          icon="plus"
          onClick={this.addNewColumn}
          size={Size.medium}
          tag="button"
          text="Add a new column"
          type="button"
        />
      </TabsWrapper>
    );
  }

  addNewColumn = () => {
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
    const columnIds = Object.keys(columns);
    const newColumnName = getNextEntityName("customColumn", columnIds);
    const nextIndex = columnIds.length;
    const columnProps: ColumnProperties = getDefaultColumnProperties(
      newColumnName,
      nextIndex,
      this.props.widgetProperties.widgetName,
      true,
    );
    const tableStyles = getTableStyles(this.props.widgetProperties);
    const column = {
      ...columnProps,
      buttonStyle: "rgb(3, 179, 101)",
      buttonLabelColor: "#FFFFFF",
      isDisabled: false,
      ...tableStyles,
    };

    this.updateProperty(`${this.props.propertyName}.${column.id}`, column);
  };

  onEdit = (index: number) => {
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || [];

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
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
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

  deleteOption = (index: number) => {
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
    const derivedColumns = this.props.widgetProperties.derivedColumns || {};
    const columnOrder = this.props.widgetProperties.columnOrder || [];

    const originalColumn = getOriginalColumn(columns, index, columnOrder);

    if (originalColumn) {
      const propertiesToDelete = [
        `${this.props.propertyName}.${originalColumn.id}`,
      ];
      if (derivedColumns[originalColumn.id])
        propertiesToDelete.push(`derivedColumns.${originalColumn.id}`);

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
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
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

  static getControlType() {
    return "PRIMARY_COLUMNS";
  }
}

export default PrimaryColumnsControl;

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
    if (!dataTreePath) {
      return {
        isInvalid: false,
        errors: [],
        pathEvaluatedValue: undefined,
      };
    }

    const errors = _.get(
      dataTree,
      getEvalErrorPath(dataTreePath),
      [],
    ) as EvaluationError[];

    const filteredLintErrors = errors.filter(
      (error) => error.errorType !== PropertyEvaluationErrorType.LINT,
    );

    const pathEvaluatedValue = _.get(dataTree, getEvalValuePath(dataTreePath));

    return {
      isInvalid: filteredLintErrors.length > 0,
      errors: filteredLintErrors,
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
const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getDataTreeForAutocomplete(state),
  datasources: state.entities.datasources,
});

const EvaluatedValuePopupWrapper = Sentry.withProfiler(
  connect(mapStateToProps)(EvaluatedValuePopupWrapperClass),
);
