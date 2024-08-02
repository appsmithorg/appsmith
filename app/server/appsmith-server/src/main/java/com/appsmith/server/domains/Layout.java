package com.appsmith.server.domains;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CompareDslActionDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import net.minidev.json.JSONObject;
import org.springframework.data.annotation.Transient;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static java.lang.Boolean.TRUE;

@Getter
@Setter
@ToString
@NoArgsConstructor
@FieldNameConstants
public class Layout {

    @JsonView({Views.Public.class, Views.Export.class})
    ScreenType screen;

    @JsonView(Views.Internal.class)
    Boolean viewMode = false;

    @JsonView({Views.Public.class, Views.Export.class, Git.class})
    JSONObject dsl;

    @JsonView(Views.Internal.class)
    JSONObject publishedDsl;

    @JsonView({Views.Public.class, Views.Export.class})
    List<Set<DslExecutableDTO>> layoutOnLoadActions;

    // this attribute will be used to display errors caused white calculating allOnLoadAction
    // PageLoadActionsUtilCEImpl.java
    @JsonView({Views.Public.class, Views.Export.class})
    List<ErrorDTO> layoutOnLoadActionErrors;

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

    @JsonView({Views.Public.class, Views.Export.class})
    private String id;

    /*
     * These fields (except for `id`) only exist here because their removal will cause a huge diff on all layouts in
     * git-connected applications. So, instead, we keep them, but defunct. For all other practical purposes, these
     * fields (again, except for `id`) don't exist.
     */
    // BEGIN DEFUNCT FIELDS
    @Deprecated(forRemoval = true)
    @Transient
    @JsonView(Views.Internal.class)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    protected Boolean deleted = false;

    @Deprecated(forRemoval = true)
    @Transient
    @JsonView(Views.Internal.class)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    protected Set<Policy> policies = Collections.emptySet();

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();
    // END DEFUNCT FIELDS

    /**
     * If view mode, the dsl returned should be the publishedDSL, else if the edit mode is on (view mode = false)
     * the dsl returned should be JSONObject dsl
     */
    @JsonView({Views.Public.class, Views.Export.class, Git.class})
    public JSONObject getDsl() {
        return viewMode ? publishedDsl : dsl;
    }

    @JsonView({Views.Public.class, Views.Export.class})
    public List<Set<DslExecutableDTO>> getLayoutOnLoadActions() {
        return viewMode ? publishedLayoutOnLoadActions : layoutOnLoadActions;
    }

    public void sanitiseToExportDBObject() {
        this.setAllOnPageLoadActionNames(null);
        this.setActionsUsedInDynamicBindings(null);
        this.setWidgetNames(null);
        List<Set<DslExecutableDTO>> layoutOnLoadActions = this.getLayoutOnLoadActions();
        if (!CollectionUtils.isNullOrEmpty(layoutOnLoadActions)) {
            // Sort actions based on id to commit to git in ordered manner
            for (int dslActionIndex = 0; dslActionIndex < layoutOnLoadActions.size(); dslActionIndex++) {
                TreeSet<DslExecutableDTO> sortedActions = new TreeSet<>(new CompareDslActionDTO());
                sortedActions.addAll(layoutOnLoadActions.get(dslActionIndex));
                layoutOnLoadActions.set(dslActionIndex, sortedActions);
            }
        }
        // Not calling the super method to keep it consistent with the old implementation
    }
}
