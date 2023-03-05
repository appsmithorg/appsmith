package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CompareDslActionDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    ScreenType screen;

    @JsonIgnore
    Boolean viewMode = false;

    JSONObject dsl;

    @JsonIgnore
    JSONObject publishedDsl;

    @Deprecated
    Set<DslActionDTO> layoutActions;

    List<Set<DslActionDTO>> layoutOnLoadActions;

    // this attribute will be used to display errors caused white calculating allOnLoadAction PageLoadActionsUtilCEImpl.java
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    List<ErrorDTO> layoutOnLoadActionErrors;

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
