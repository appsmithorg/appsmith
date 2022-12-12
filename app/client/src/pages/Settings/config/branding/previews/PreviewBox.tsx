import React from "react";

type PreviewBoxProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const PreviewBox = (props: PreviewBoxProps) => {
  const { children, className, title, ...rest } = props;

  return (
    <div
      className={`flex justify-center h-full border relative ${className ??
        ""}`}
      {...rest}
    >
      {children}
      {title && (
        <p className="absolute px-1 text-xs font-medium text-gray-500 uppercase bg-gray-300 rounded-sm bottom-2 left-2">
          {title}
        </p>
      )}
    </div>
  );
};

export default PreviewBox;
