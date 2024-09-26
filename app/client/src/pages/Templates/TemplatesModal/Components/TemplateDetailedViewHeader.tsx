import { TEMPLATES_BACK_BUTTON, createMessage } from "ee/constants/messages";
import { Link, Text } from "@appsmith/ads";
import React from "react";

interface Props {
  onBackPress: () => void;
  title: string;
}

const TemplateDetailedViewHeader = (props: Props) => {
  return (
    <div className="flex flex-row items-center ">
      <Link
        className="back-button"
        kind="secondary"
        onClick={props.onBackPress}
        startIcon="back-control"
      >
        {createMessage(TEMPLATES_BACK_BUTTON)}
      </Link>
      <Text kind="heading-l">{props.title}</Text>
    </div>
  );
};

export default TemplateDetailedViewHeader;
