import React from "react";
import { ContentBox } from "pages/AdminSettings/components";
import { Text } from "@appsmith/ads";

interface PreviewBoxProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const PreviewBox = (props: PreviewBoxProps) => {
  const { children, className, title, ...rest } = props;

  return (
    <div className="flex flex-col">
      <ContentBox
        className={`flex justify-center h-full border mb-1 relative ${
          className ?? ""
        }`}
        {...rest}
      >
        {children}
      </ContentBox>
      {title && <Text renderAs="p">{title}</Text>}
    </div>
  );
};

export default PreviewBox;
