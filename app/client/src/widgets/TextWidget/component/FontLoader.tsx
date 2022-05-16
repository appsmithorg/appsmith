import React from "react";
import useGoogleFont from "utils/hooks/useGoogleFont";

interface Props {
  fontFamily: string;
  children?: React.ReactNode;
}

const FontLoader = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  const fontFamily = useGoogleFont(props.fontFamily);

  return (
    <div ref={ref} style={{ fontFamily, height: "100%" }}>
      {props.children}
    </div>
  );
});

FontLoader.displayName = "FontLoader";

export default FontLoader;
