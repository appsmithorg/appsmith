import React from "react";
import LoaderIcon from "remixicon-react/Loader2FillIcon";

type IconProps = {
  className?: string;
};

const Spinner = (props: IconProps) => {
  const { className, ...rest } = props;

  return (
    <LoaderIcon
      className={`h-5 w-5 fill-current animate-spin ${className}`}
      {...rest}
    />
  );
};

export { Spinner };
