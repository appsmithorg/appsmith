import React, { useEffect } from "react";
import ListView from "../components/ListView";
import history from "../../../utils/history";
import { datasourcesEditorIdURL } from "RouteBuilder";
import { useParams } from "react-router";
import ListSubTitle from "../components/ListSubTitle";
import { Button } from "design-system";
import { useIDEDatasources } from "../hooks";
import { useDispatch } from "react-redux";
import { showAddDatasourceModal } from "../ideActions";

const DataLeftPane = () => {
  const params = useParams<{ appId: string; dataId?: string }>();
  const datasources = useIDEDatasources();
  const dispatch = useDispatch();
  useEffect(() => {
    if (params.dataId) {
      dispatch(showAddDatasourceModal(false));
    }
  }, [params.dataId]);
  const onItemClick = (item: any) => {
    history.push(
      datasourcesEditorIdURL({
        datasourceId: item.key,
        pageId: "test",
        appId: params.appId,
      }),
    );
  };
  return (
    <div className="h-full">
      <ListSubTitle
        rightIcon={
          <Button
            isIconButton
            kind="tertiary"
            onClick={() => dispatch(showAddDatasourceModal(true))}
            startIcon={"plus"}
          />
        }
        title={"Datasources in your workspace"}
      />
      <ListView items={datasources} onClick={onItemClick} />
    </div>
  );
};

export default DataLeftPane;
