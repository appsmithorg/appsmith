import React from "react";
import { Icon } from "@blueprintjs/core";
import moment from "moment-timezone";
import {
  MenuColumnWrapper,
  CellWrapper,
  ActionWrapper,
} from "./TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { ColumnMenuOptionProps } from "./ReactTableComponent";
import { isString } from "lodash";
import VideoComponent from "components/designSystems/appsmith/VideoComponent";
import AutoToolTipComponent from "components/designSystems/appsmith/AutoToolTipComponent";

interface MenuOptionProps {
  columnAccessor?: string;
  isColumnHidden: boolean;
  columnType: string;
  format?: string;
  hideColumn: (columnIndex: number, isColumnHidden: boolean) => void;
  updateAction: (columnIndex: number, action: string) => void;
  updateColumnType: (columnIndex: number, columnType: string) => void;
  handleUpdateCurrencySymbol: (
    columnIndex: number,
    currencySymbol: string,
  ) => void;
  handleDateFormatUpdate: (columnIndex: number, dateFormat: string) => void;
}

export const getMenuOptions = (props: MenuOptionProps) => {
  const basicOptions: ColumnMenuOptionProps[] = [
    {
      content: "Rename a Column",
      closeOnClick: true,
      id: "rename_column",
      onClick: (columnIndex: number) => {
        props.updateAction(columnIndex, "rename_column");
      },
    },
    {
      content: props.isColumnHidden ? "Show Column" : "Hide Column",
      closeOnClick: true,
      id: "hide_column",
      onClick: (columnIndex: number) => {
        props.hideColumn(columnIndex, props.isColumnHidden);
      },
    },
  ];
  if (props.columnAccessor && props.columnAccessor === "actions") {
    return basicOptions;
  }
  const columnMenuOptions: ColumnMenuOptionProps[] = [
    ...basicOptions,
    {
      content: "Select a Data Type",
      id: "change_column_type",
      category: true,
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "image"}>
          <Icon
            icon="media"
            iconSize={12}
            color={props.columnType === "image" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Image</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === "image",
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, "image");
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "video"}>
          <Icon
            icon="video"
            iconSize={12}
            color={props.columnType === "video" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Video</div>
        </MenuColumnWrapper>
      ),
      isSelected: props.columnType === "video",
      closeOnClick: true,
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, "video");
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "text"}>
          <Icon
            icon="label"
            iconSize={12}
            color={props.columnType === "text" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Text</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === "text",
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, "text");
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "currency"}>
          <Icon
            icon="dollar"
            iconSize={12}
            color={props.columnType === "currency" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Currency</div>
          <Icon
            className="sub-menu"
            icon="chevron-right"
            iconSize={16}
            color={props.columnType === "currency" ? "#ffffff" : "#2E3D49"}
          />
        </MenuColumnWrapper>
      ),
      closeOnClick: false,
      isSelected: props.columnType === "currency",
      options: [
        {
          content: "USD - $",
          isSelected: props.format === "$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "$");
          },
        },
        {
          content: "INR - ₹",
          isSelected: props.format === "₹",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "₹");
          },
        },
        {
          content: "GBP - £",
          isSelected: props.format === "£",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "£");
          },
        },
        {
          content: "AUD - A$",
          isSelected: props.format === "A$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "A$");
          },
        },
        {
          content: "EUR - €",
          isSelected: props.format === "€",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "€");
          },
        },
        {
          content: "SGD - S$",
          isSelected: props.format === "S$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "S$");
          },
        },
        {
          content: "CAD - C$",
          isSelected: props.format === "C$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "C$");
          },
        },
      ],
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "date"}>
          <Icon
            icon="calendar"
            iconSize={12}
            color={props.columnType === "date" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Date</div>
          <Icon
            className="sub-menu"
            icon="chevron-right"
            iconSize={16}
            color={props.columnType === "date" ? "#ffffff" : "#2E3D49"}
          />
        </MenuColumnWrapper>
      ),
      closeOnClick: false,
      isSelected: props.columnType === "date",
      options: [
        {
          content: "MM-DD-YY",
          isSelected: props.format === "MM-DD-YY",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(columnIndex, "MM-DD-YY");
          },
        },
        {
          content: "DD-MM-YY",
          isSelected: props.format === "DD-MM-YY",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(columnIndex, "DD-MM-YY");
          },
        },
        {
          content: "DD/MM/YY",
          isSelected: props.format === "DD/MM/YY",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(columnIndex, "DD/MM/YY");
          },
        },
        {
          content: "MM/DD/YY",
          isSelected: props.format === "MM/DD/YY",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(columnIndex, "MM/DD/YY");
          },
        },
      ],
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "time"}>
          <Icon
            icon="time"
            iconSize={12}
            color={props.columnType === "time" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Time</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === "time",
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, "time");
        }
      },
    },
  ];
  return columnMenuOptions;
};

export const renderCell = (
  value: any,
  rowIndex: number,
  columnType: string,
  isHidden: boolean,
  widgetId: string,
  format?: string,
) => {
  if (!value) {
    return <div></div>;
  }
  switch (columnType) {
    case "image":
      if (!isString(value)) {
        return (
          <CellWrapper isHidden={isHidden}>
            <div>Invalid Image </div>
          </CellWrapper>
        );
      }
      const imageRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
      return (
        <CellWrapper isHidden={isHidden}>
          {value
            .toString()
            .split(",")
            .map((item: string, index: number) => {
              if (imageRegex.test(item)) {
                return (
                  <div
                    key={index}
                    className="image-cell"
                    style={{ backgroundImage: `url("${item}")` }}
                  />
                );
              } else {
                return <div>Invalid Image</div>;
              }
            })}
        </CellWrapper>
      );
    case "video":
      const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
      if (isString(value) && youtubeRegex.test(value)) {
        return (
          <CellWrapper isHidden={isHidden} className="video-cell">
            <VideoComponent url={value} />
          </CellWrapper>
        );
      } else {
        return (
          <CellWrapper isHidden={isHidden}>Invalid Video Link</CellWrapper>
        );
      }
    case "currency":
      if (!isNaN(value)) {
        return (
          <AutoToolTipComponent
            title={`${format}${value}`}
            isHidden={isHidden}
          >{`${format}${value}`}</AutoToolTipComponent>
        );
      } else {
        return <CellWrapper isHidden={isHidden}>Invalid Value</CellWrapper>;
      }
    case "date":
      let isValidDate = true;
      if (isNaN(value)) {
        const dateTime = Date.parse(value);
        if (isNaN(dateTime)) {
          isValidDate = false;
        }
      }
      if (isValidDate) {
        return (
          <AutoToolTipComponent
            title={moment(value).format(format)}
            isHidden={isHidden}
          >
            {moment(value).format(format)}
          </AutoToolTipComponent>
        );
      } else {
        return <CellWrapper isHidden={isHidden}>Invalid Date</CellWrapper>;
      }
    case "time":
      let isValidTime = true;
      if (isNaN(value)) {
        const time = Date.parse(value);
        if (isNaN(time)) {
          isValidTime = false;
        }
      }
      if (isValidTime) {
        return (
          <CellWrapper isHidden={isHidden}>
            {moment(value).format("HH:mm")}
          </CellWrapper>
        );
      } else {
        return <CellWrapper isHidden={isHidden}>Invalid Time</CellWrapper>;
      }
    case "text":
      const text = isString(value) ? value : JSON.stringify(value);
      return (
        <AutoToolTipComponent title={text} isHidden={isHidden}>
          {text}
        </AutoToolTipComponent>
      );
    default:
      const data = isString(value) ? value : JSON.stringify(value);
      return (
        <AutoToolTipComponent title={data} isHidden={isHidden}>
          {data}
        </AutoToolTipComponent>
      );
  }
};

interface RenderActionProps {
  columnActions?: ColumnAction[];
  onCommandClick: (dynamicTrigger: string) => void;
}

export const renderActions = (props: RenderActionProps) => {
  if (!props.columnActions) return <CellWrapper isHidden={false}></CellWrapper>;
  return (
    <CellWrapper isHidden={false}>
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <ActionWrapper
            key={index}
            onClick={() => {
              props.onCommandClick(action.dynamicTrigger);
            }}
          >
            {action.label}
          </ActionWrapper>
        );
      })}
    </CellWrapper>
  );
};
