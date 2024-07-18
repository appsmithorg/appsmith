import React from "react";

interface Props {
  children: React.ReactNode;
}

const Wrapper = (props: Props) => {
  return <div>{props.children}</div>;
};
export default Wrapper;
