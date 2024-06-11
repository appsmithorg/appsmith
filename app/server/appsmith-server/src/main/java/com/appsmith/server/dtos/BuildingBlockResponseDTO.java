package com.appsmith.server.dtos;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import lombok.Data;

import java.util.List;

@Data
public class BuildingBlockResponseDTO {
    String widgetDsl;

    List<DslExecutableDTO> onPageLoadActions;

    List<NewAction> newActionList;

    List<ActionCollection> actionCollectionList;

    List<Datasource> datasourceList;

    List<CustomJSLib> customJSLibList;
}
