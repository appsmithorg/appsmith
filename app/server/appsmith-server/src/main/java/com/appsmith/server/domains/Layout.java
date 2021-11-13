package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.DslActionDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.JSONObject;

import java.util.List;
import java.util.Set;

import static java.lang.Boolean.TRUE;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class Layout extends BaseDomain {

    ScreenType screen;

    @JsonIgnore
    Boolean viewMode = false;

    JSONObject dsl;

    @JsonIgnore
    JSONObject publishedDsl;

    @Deprecated
    Set<DslActionDTO> layoutActions;

    List<Set<DslActionDTO>> layoutOnLoadActions;

    @Deprecated
    @JsonIgnore
    Set<DslActionDTO> publishedLayoutActions;

    @JsonIgnore
    List<Set<DslActionDTO>> publishedLayoutOnLoadActions;

    @JsonIgnore
    Set<String> widgetNames;

    @JsonIgnore
    Set<String> allOnPageLoadActionNames;

    @JsonIgnore
    Set<ActionDependencyEdge> allOnPageLoadActionEdges;

    @JsonIgnore
    Set<String> actionsUsedInDynamicBindings;

    @JsonIgnore
    Set<String> mongoEscapedWidgetNames;

    @JsonIgnore
    Boolean validOnPageLoadActions = TRUE;

    /**
     * If view mode, the dsl returned should be the publishedDSL, else if the edit mode is on (view mode = false)
     * the dsl returned should be JSONObject dsl
     */
    public JSONObject getDsl() {
        return viewMode ? publishedDsl : dsl;
    }

    @Deprecated
    public Set<DslActionDTO> getLayoutActions() {
        return viewMode ? publishedLayoutActions : layoutActions;
    }

    public List<Set<DslActionDTO>> getLayoutOnLoadActions() {
        return viewMode ? publishedLayoutOnLoadActions : layoutOnLoadActions;
    }
}
