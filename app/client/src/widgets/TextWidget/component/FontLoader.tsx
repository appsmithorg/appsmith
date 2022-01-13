import React from "react";
import useGoogleFont from "utils/hooks/useGoogleFont";

interface Props {
  fontFamily: string;
  children?: React.ReactNode;
}
function FontLoader(props: Props) {
  const fontFamily = useGoogleFont(props.fontFamily);

  return (
    <div
      style={{
        fontFamily: fontFamily,
      }}
    >
      {props.children}
    </div>
  );
}

export default FontLoader;
