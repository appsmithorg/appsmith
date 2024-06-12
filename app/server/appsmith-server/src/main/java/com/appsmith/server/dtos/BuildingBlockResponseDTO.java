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

    // New actions created in the current flow
    List<NewAction> newActionList;

    // New actionCollection created in the current flow
    List<ActionCollection> actionCollectionList;

    // All datasource in the workspace
    List<Datasource> datasourceList;

    // All libraries used in the current application
    List<CustomJSLib> customJSLibList;
}
