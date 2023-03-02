package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CompareDslActionDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.JSONObject;
import com.appsmith.external.exceptions.ErrorDTO;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static java.lang.Boolean.TRUE;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class Layout extends BaseDomain {

    @JsonView(Views.Public.class)
    ScreenType screen;

    @JsonView(Views.Internal.class)
    Boolean viewMode = false;

    @JsonView(Views.Public.class)
    JSONObject dsl;

    @JsonView(Views.Internal.class)
    JSONObject publishedDsl;

    @Deprecated
    @JsonView(Views.Public.class)
    Set<DslActionDTO> layoutActions;

    @JsonView(Views.Public.class)
    List<Set<DslActionDTO>> layoutOnLoadActions;

    // this attribute will be used to display errors caused white calculating allOnLoadAction PageLoadActionsUtilCEImpl.java
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    List<ErrorDTO> layoutOnLoadActionErrors;

    @Deprecated
    @JsonView(Views.Internal.class)
    Set<DslActionDTO> publishedLayoutActions;

    @JsonView(Views.Internal.class)
    List<Set<DslActionDTO>> publishedLayoutOnLoadActions;

    @JsonView(Views.Internal.class)
    Set<String> widgetNames;

    @JsonView(Views.Internal.class)
    Set<String> allOnPageLoadActionNames;

    @JsonView(Views.Internal.class)
    Set<ActionDependencyEdge> allOnPageLoadActionEdges;

    @JsonView(Views.Internal.class)
    Set<String> actionsUsedInDynamicBindings;

    @JsonView(Views.Internal.class)
    Set<String> mongoEscapedWidgetNames;

    @JsonView(Views.Internal.class)
    Boolean validOnPageLoadActions = TRUE;

    /**
     * If view mode, the dsl returned should be the publishedDSL, else if the edit mode is on (view mode = false)
     * the dsl returned should be JSONObject dsl
     */
    @JsonView(Views.Public.class)
    public JSONObject getDsl() {
        return viewMode ? publishedDsl : dsl;
    }

    @Deprecated
    @JsonView(Views.Public.class)
    public Set<DslActionDTO> getLayoutActions() {
        return viewMode ? publishedLayoutActions : layoutActions;
    }

    @JsonView(Views.Public.class)
    public List<Set<DslActionDTO>> getLayoutOnLoadActions() {
        return viewMode ? publishedLayoutOnLoadActions : layoutOnLoadActions;
    }

    public void sanitiseToExportDBObject() {
        this.setAllOnPageLoadActionNames(null);
        this.setCreatedAt(null);
        this.setUpdatedAt(null);
        this.setActionsUsedInDynamicBindings(null);
        this.setWidgetNames(null);
        List<Set<DslActionDTO>> layoutOnLoadActions = this.getLayoutOnLoadActions();
        if (!CollectionUtils.isNullOrEmpty(layoutOnLoadActions)) {
            // Sort actions based on id to commit to git in ordered manner
            for (int dslActionIndex = 0; dslActionIndex < layoutOnLoadActions.size(); dslActionIndex++) {
                TreeSet<DslActionDTO> sortedActions = new TreeSet<>(new CompareDslActionDTO());
                sortedActions.addAll(layoutOnLoadActions.get(dslActionIndex));
                sortedActions.forEach(DslActionDTO::sanitiseForExport);
                layoutOnLoadActions.set(dslActionIndex, sortedActions);
            }
        }
    }
}
