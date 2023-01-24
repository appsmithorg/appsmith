package com.appsmith.server.models.export;

import java.util.List;
import java.util.Set;

import org.json.JSONObject;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.models.Views;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.domains.ScreenType;
import com.appsmith.server.dtos.DslActionDTO;
import com.fasterxml.jackson.annotation.JsonView;

import static java.lang.Boolean.TRUE;

import lombok.Data;

@Data
public class LayoutMetadata {
    private ScreenType screen;
    private Boolean viewMode = false;
    @JsonView(Views.Internal.class)
    private JSONObject dsl; // Save this in canvas.json for now
    private Set<DslActionDTO> layoutActions;
    private List<Set<DslActionDTO>> layoutOnLoadActions;
    private List<ErrorDTO> layoutOnLoadActionErrors;
    private Set<DslActionDTO> publishedLayoutActions;
    private List<Set<DslActionDTO>> publishedLayoutOnLoadActions;
    private Set<String> widgetNames;
    private Set<String> allOnPageLoadActionNames;
    private Set<ActionDependencyEdge> allOnPageLoadActionEdges;
    private Set<String> actionsUsedInDynamicBindings;
    private Set<String> mongoEscapedWidgetNames;
    private Boolean validOnPageLoadActions = TRUE;
}
