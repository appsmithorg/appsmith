import React from "react";
import Disabler from "../../../../../common/Disabler";
import { usePluginActionContext } from "../../../../../../PluginActionEditor";
import { useSelector } from "react-redux";
import { getIsActionConverting } from "ee/selectors/entitiesSelector";

interface Props {
  children: React.ReactNode | React.ReactNode[];
}

const ConvertToModuleDisabler = (props: Props) => {
  const { action } = usePluginActionContext();
  const isConverting = useSelector((state) =>
    getIsActionConverting(state, action.id),
  );

  return <Disabler isDisabled={isConverting}>{props.children}</Disabler>;
};

export default ConvertToModuleDisabler;
