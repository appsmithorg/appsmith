package com.appsmith.server.dtos.ce;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.exceptions.AppsmithError;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
@FieldNameConstants
public class ActionCollectionCE_DTO {

    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @Transient
    @JsonView(Views.Public.class)
    private String baseId;

    @Transient
    @JsonView(Views.Public.class)
    String applicationId;

    @Transient
    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView({Views.Public.class, Git.class})
    String name;

    @JsonView({Views.Public.class, Git.class})
    String pageId;

    @JsonView({Views.Public.class, Git.class})
    CreatorContextType contextType;

    // This field will only be populated if this collection is bound to one plugin (eg: JS)
    @JsonView({Views.Public.class, Git.class})
    String pluginId;

    // this attribute carries error messages while processing the actionCollection
    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    List<ErrorDTO> errorReports;

    @JsonView({Views.Public.class, Git.class})
    PluginType pluginType;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant deletedAt;

    // Instead of storing the entire action object, we only populate this field while interacting with the client side
    @Transient
    @JsonView(Views.Public.class)
    List<ActionDTO> actions = List.of();

    // TODO : Remove after clean up, this is only kept as of now because removing it will show up as a diff on git
    @Transient
    @JsonView(Views.Public.class)
    List<ActionDTO> archivedActions = List.of();

    // JS collection fields
    // This is the raw body that contains the entire JS Object definition as the user has written it
    @JsonView(Views.Public.class)
    String body;

    // This list is currently used to record constants
    @JsonView({Views.Public.class, Git.class})
    List<JSValue> variables;

    // Instead of storing the entire action object, we only populate this field while interacting with the client side
    @Transient
    @JsonView(Views.Public.class)
    Set<String> userPermissions = Set.of();

    public Set<String> validate() {
        Set<String> validationErrors = new HashSet<>();
        if (this.workspaceId == null) {
            validationErrors.add(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKSPACE_ID));
        }
        if (this.pluginId == null) {
            validationErrors.add(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PLUGIN_ID));
        }
        if (this.pluginType == null) {
            validationErrors.add(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PLUGIN_TYPE));
        }
        return validationErrors;
    }

    public void populateTransientFields(ActionCollection actionCollection) {
        this.setId(actionCollection.getId());
        this.setBaseId(actionCollection.getBaseIdOrFallback());
        this.setApplicationId(actionCollection.getApplicationId());
        this.setWorkspaceId(actionCollection.getWorkspaceId());
        this.setUserPermissions(actionCollection.userPermissions);
    }

    public void sanitiseForExport() {
        this.resetTransientFields();
        this.setUserPermissions(Set.of());
    }

    @JsonView({Views.Internal.class})
    public String getUserExecutableName() {
        return this.getName();
    }

    protected void resetTransientFields() {
        this.setId(null);
        this.setBaseId(null);
        this.setWorkspaceId(null);
        this.setApplicationId(null);
        this.setErrorReports(null);
        this.setActions(List.of());
    }

    public String calculateContextId() {
        return this.getPageId();
    }

    public static class Fields {}

    public String getArtifactId() {
        return this.getApplicationId();
    }

    public String getContextId() {
        return this.getPageId();
    }
}
