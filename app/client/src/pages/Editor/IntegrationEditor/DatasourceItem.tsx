import React, { type ReactNode } from "react";
import {
  DatasourceCard,
  DatasourceDescription,
  DatasourceImage,
  DatasourceName,
  DatasourceNameWrapper,
} from "./IntegrationStyledComponents";

interface DatasourceItem {
  className?: string;
  name: string;
  icon: string;
  description?: string;
  handleOnClick: () => unknown;
  rightSibling?: ReactNode;
  dataNameTestId?: string;
  dataCardTestId?: string;
  dataCardWrapperTestId?: string;
  dataCardDescriptionTestId?: string;
  dataCardImageTestId?: string;
}

export default function DatasourceItem({
  className = "",
  dataCardDescriptionTestId = "datasource-description",
  dataCardImageTestId = "datasource-image",
  dataCardTestId = "datasource-card",
  dataCardWrapperTestId = "datasource-content-wrapper",
  dataNameTestId = "datasource-name",
  description,
  handleOnClick,
  icon,
  name,
  rightSibling,
}: DatasourceItem) {
  return (
    <DatasourceCard
      className={`t--create-${name} ${className}`}
      data-testid={dataCardTestId}
      onClick={handleOnClick}
    >
      <DatasourceImage
        alt={name}
        className="content-icon"
        data-testid={dataCardImageTestId}
        src={icon}
      />
      <DatasourceNameWrapper data-testid={dataCardWrapperTestId}>
        <DatasourceName
          className="t--plugin-name"
          data-testid={dataNameTestId}
          renderAs="p"
        >
          {name}
        </DatasourceName>
        <DatasourceDescription data-testid={dataCardDescriptionTestId}>
          {description}
        </DatasourceDescription>
      </DatasourceNameWrapper>
      {rightSibling}
    </DatasourceCard>
  );
}
