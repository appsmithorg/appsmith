package com.appsmith.server.domains;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CompareDslActionDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.JSONObject;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static java.lang.Boolean.TRUE;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class Layout extends BaseDomain {

    @JsonView({Views.Public.class, Views.Export.class})
    ScreenType screen;

    @JsonView(Views.Internal.class)
    Boolean viewMode = false;

    @JsonView({Views.Public.class, Views.Export.class})
    JSONObject dsl;

    @JsonView(Views.Internal.class)
    JSONObject publishedDsl;

    @Deprecated
    @JsonView({Views.Public.class, Views.Export.class})
    Set<DslExecutableDTO> layoutActions;

    @JsonView({Views.Public.class, Views.Export.class})
    List<Set<DslExecutableDTO>> layoutOnLoadActions;

    @JsonView({Views.Public.class, Views.Export.class})
    @Override
    public String getId() {
        return super.getId();
    }

    // this attribute will be used to display errors caused white calculating allOnLoadAction
    // PageLoadActionsUtilCEImpl.java
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView({Views.Public.class, Views.Export.class})
    List<ErrorDTO> layoutOnLoadActionErrors;

    @Deprecated
    @JsonView(Views.Internal.class)
    Set<DslExecutableDTO> publishedLayoutActions;

    @JsonView(Views.Internal.class)
    List<Set<DslExecutableDTO>> publishedLayoutOnLoadActions;

    @JsonView(Views.Internal.class)
    Set<String> widgetNames;

    @JsonView(Views.Internal.class)
    Set<String> allOnPageLoadActionNames;

    @JsonView(Views.Internal.class)
    Set<ExecutableDependencyEdge> allOnPageLoadActionEdges;

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
    @JsonView({Views.Public.class, Views.Export.class})
    public JSONObject getDsl() {
        return viewMode ? publishedDsl : dsl;
    }

    @Deprecated
    @JsonView({Views.Public.class, Views.Export.class})
    public Set<DslExecutableDTO> getLayoutActions() {
        return viewMode ? publishedLayoutActions : layoutActions;
    }

    @JsonView({Views.Public.class, Views.Export.class})
    public List<Set<DslExecutableDTO>> getLayoutOnLoadActions() {
        return viewMode ? publishedLayoutOnLoadActions : layoutOnLoadActions;
    }

    @Override
    public void sanitiseToExportDBObject() {
        this.setAllOnPageLoadActionNames(null);
        this.setCreatedAt(null);
        this.setUpdatedAt(null);
        this.setActionsUsedInDynamicBindings(null);
        this.setWidgetNames(null);
        List<Set<DslExecutableDTO>> layoutOnLoadActions = this.getLayoutOnLoadActions();
        if (!CollectionUtils.isNullOrEmpty(layoutOnLoadActions)) {
            // Sort actions based on id to commit to git in ordered manner
            for (int dslActionIndex = 0; dslActionIndex < layoutOnLoadActions.size(); dslActionIndex++) {
                TreeSet<DslExecutableDTO> sortedActions = new TreeSet<>(new CompareDslActionDTO());
                sortedActions.addAll(layoutOnLoadActions.get(dslActionIndex));
                sortedActions.forEach(DslExecutableDTO::sanitiseForExport);
                layoutOnLoadActions.set(dslActionIndex, sortedActions);
            }
        }
        // Not calling the super method to keep it consistent with the old implementation
    }
}
