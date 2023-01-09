import React from "react";

function SpacingComponent(props: any /*SpacingComponentProps*/) {
  const styles = props.fill
    ? {
        width: "100%",
        backgroundColor: "lightgray",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }
    : {
        width: "100%",
      };
  return <div style={styles}>{props.fill && props.value}</div>;
}

//export interface SpacingComponentProps {}

export default SpacingComponent;
