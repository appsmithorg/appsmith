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
}

export default function DatasourceItem({
  className,
  description,
  handleOnClick,
  icon,
  name,
  rightSibling,
}: DatasourceItem) {
  return (
    <DatasourceCard
      className={`t--create-${name} ${className}`}
      onClick={handleOnClick}
    >
      <DatasourceImage alt={name} src={icon} />
      <DatasourceNameWrapper>
        <DatasourceName className="t--plugin-name" renderAs="p">
          {name}
        </DatasourceName>
        <DatasourceDescription data-testid="mockdatasource-description">
          {description}
        </DatasourceDescription>
      </DatasourceNameWrapper>
      {rightSibling}
    </DatasourceCard>
  );
}
