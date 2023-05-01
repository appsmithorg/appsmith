package com.appsmith.server.dtos;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ActionCollection;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionCollectionDTO {

    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @Transient
    @JsonView(Views.Public.class)
    String applicationId;

    @Transient
    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String pageId;

    // This field will only be populated if this collection is bound to one plugin (eg: JS)
    @JsonView(Views.Public.class)
    String pluginId;

    //this attribute carries error messages while processing the actionCollection
    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    List<ErrorDTO> errorReports;

    @JsonView(Views.Public.class)
    PluginType pluginType;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant deletedAt;

    // TODO can be used as template for new actions in collection,
    //  or as default configuration for all actions in the collection
//    ActionDTO defaultAction;

    // This property is not shared with the client since the reference is only useful to server
    // Map<defaultActionId, branchedActionId>
    @JsonView(Views.Internal.class)
    Map<String, String> defaultToBranchedActionIdsMap = Map.of();

    @Deprecated
    @JsonView(Views.Public.class)
    Set<String> actionIds = Set.of();

    // This property is not shared with the client since the reference is only useful to server
    // Archived actions represent actions that have been removed from a js object but may be subject to re-use by the user
    // Map<defaultActionId, branchedActionId>
    @JsonView(Views.Internal.class)
    Map<String, String> defaultToBranchedArchivedActionIdsMap = Map.of();

    @Deprecated
    @JsonView(Views.Public.class)
    Set<String> archivedActionIds = Set.of();

    // Instead of storing the entire action object, we only populate this field while interacting with the client side
    @Transient
    @JsonView(Views.Public.class)
    List<ActionDTO> actions = List.of();

    // Instead of storing the entire action object, we only populate this field while interacting with the client side
    @Transient
    @JsonView(Views.Public.class)
    List<ActionDTO> archivedActions = List.of();

    // JS collection fields
    // This is the raw body that contains the entire JS object definition as the user has written it
    @JsonView(Views.Public.class)
    String body;

    // This list is currently used to record constants
    @JsonView(Views.Public.class)
    List<JSValue> variables;

    // This will be used to store the defaultPageId but other fields like branchName, applicationId will act as transient
    @JsonView(Views.Internal.class)
    DefaultResources defaultResources;

    // Instead of storing the entire action object, we only populate this field while interacting with the client side
    @Transient
    @JsonView(Views.Public.class)
    Set<String> userPermissions = Set.of();

    public Set<String> validate() {
        Set<String> validationErrors = new HashSet<>();
        if (this.workspaceId == null) {
            validationErrors.add(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKSPACE_ID));
        }
        if (this.applicationId == null) {
            validationErrors.add(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID));
        }
        if (this.pageId == null) {
            validationErrors.add(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID));
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
        this.setApplicationId(actionCollection.getApplicationId());
        this.setWorkspaceId(actionCollection.getWorkspaceId());
        this.setUserPermissions(actionCollection.userPermissions);
        copyNewFieldValuesIntoOldObject(actionCollection.getDefaultResources(), this.getDefaultResources());
    }

    public void sanitiseForExport() {
        this.setDefaultResources(null);
        this.setDefaultToBranchedActionIdsMap(null);
        this.setDefaultToBranchedArchivedActionIdsMap(null);
        this.setActionIds(null);
        this.setArchivedActionIds(null);
    }
}
