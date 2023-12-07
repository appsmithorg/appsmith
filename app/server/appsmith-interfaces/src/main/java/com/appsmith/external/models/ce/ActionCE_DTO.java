package com.appsmith.external.models.ce;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionProvider;
import com.appsmith.external.models.AnalyticsInfo;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Documentation;
import com.appsmith.external.models.EntityReferenceType;
import com.appsmith.external.models.Executable;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.views.Views;
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
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionCE_DTO implements Identifiable, Executable {

    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @Transient
    @JsonView(Views.Public.class)
    String applicationId;

    @Transient
    @JsonView(Views.Public.class)
    String workspaceId;

    @Transient
    @JsonView(Views.Public.class)
    PluginType pluginType;

    // name of the plugin. used to log analytics events where pluginName is a required attribute
    // It'll be null if not set
    @Transient
    @JsonView(Views.Public.class)
    String pluginName;

    @Transient
    @JsonView(Views.Public.class)
    String pluginId;

    @JsonView(Views.Public.class)
    String name;

    // The FQN for an action will also include any collection it is a part of as collectionName.actionName
    @JsonView(Views.Public.class)
    String fullyQualifiedName;

    @JsonView(Views.Public.class)
    Datasource datasource;

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    CreatorContextType contextType;

    @JsonView(Views.Public.class)
    String collectionId;

    @JsonView(Views.Public.class)
    ActionConfiguration actionConfiguration;

    // this attribute carries error messages while processing the actionCollection
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Transient
    @JsonView(Views.Public.class)
    List<ErrorDTO> errorReports;

    @JsonView(Views.Public.class)
    Boolean executeOnLoad;

    @JsonView(Views.Public.class)
    Boolean clientSideExecution;

    /*
     * This is a list of fields specified by the client to signify which fields have dynamic bindings in them.
     * TODO: The server can use this field to simplify our Mustache substitutions in the future
     */
    @JsonView(Views.Public.class)
    List<Property> dynamicBindingPathList;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Boolean isValid;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Set<String> invalids;

    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Set<String> messages = new HashSet<>();

    // This is a list of keys that the client whose values the client needs to send during action execution.
    // These are the Mustache keys that the server will replace before invoking the API
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Set<String> jsonPathKeys;

    @JsonView(Views.Internal.class)
    String cacheResponse;

    @Transient
    @JsonView(Views.Public.class)
    String templateId; // If action is created via a template, store the id here.

    @Transient
    @JsonView(Views.Public.class)
    String providerId; // If action is created via a template, store the template's provider id here.

    @Transient
    @JsonView(Views.Public.class)
    ActionProvider provider;

    @JsonView(Views.Internal.class)
    Boolean userSetOnLoad = false;

    @JsonView(Views.Public.class)
    Boolean confirmBeforeExecute = false;

    @Transient
    @JsonView(Views.Public.class)
    Documentation documentation;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant deletedAt = null;

    @Deprecated
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant archivedAt = null;

    @Transient
    @JsonView(Views.Internal.class)
    protected Set<Policy> policies = new HashSet<>();

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    // This field will be used to store the default/root actionId and applicationId for actions generated for git
    // connected applications and will be used to connect actions across the branches
    @JsonView(Views.Internal.class)
    DefaultResources defaultResources;

    // This field will be used to store analytics data related to this specific domain object. It's been introduced in
    // order to track
    // success metrics of modules. Learn more on GitHub issue#24734
    @JsonView(Views.Public.class)
    AnalyticsInfo eventData;

    @JsonView(Views.Internal.class)
    protected Instant createdAt;

    @JsonView(Views.Internal.class)
    protected Instant updatedAt;

    @Override
    @JsonView(Views.Public.class)
    public String getValidName() {
        if (this.fullyQualifiedName == null) {
            return this.name;
        } else {
            return this.fullyQualifiedName;
        }
    }

    @Override
    public String getExecutableName() {
        return this.getValidName();
    }

    @Override
    public EntityReferenceType getEntityReferenceType() {
        if (this.getPluginType() == null) {
            return null;
        }
        return this.getPluginType().equals(PluginType.JS) ? EntityReferenceType.JSACTION : EntityReferenceType.ACTION;
    }

    public void sanitiseToExportDBObject() {
        this.setEventData(null);
        this.setDefaultResources(null);
        this.setCacheResponse(null);
        if (this.getDatasource() != null) {
            this.getDatasource().setCreatedAt(null);
            this.getDatasource().setDatasourceStorages(null);
        }
        if (this.getUserPermissions() != null) {
            this.getUserPermissions().clear();
        }
        if (this.getPolicies() != null) {
            this.getPolicies().clear();
        }
    }

    @Override
    public Set<String> getSelfReferencingDataPaths() {
        if (this.getActionConfiguration() == null) {
            return new HashSet<>();
        }
        return this.getActionConfiguration().getSelfReferencingDataPaths();
    }

    @Override
    public ActionConfiguration getExecutableConfiguration() {
        return this.getActionConfiguration();
    }

    @Override
    public String getConfigurationPath() {
        return this.getValidName() + ".actionConfiguration";
    }

    @Override
    public String getCompleteDynamicBindingPath(String fieldPath) {
        return this.getConfigurationPath() + "." + fieldPath;
    }

    @Override
    public boolean hasExtractableBinding() {
        return PluginType.JS.equals(this.getPluginType());
    }

    @Override
    public DslExecutableDTO getDslExecutable() {
        DslExecutableDTO dslExecutableDTO = new DslExecutableDTO();

        dslExecutableDTO.setId(this.getId());
        dslExecutableDTO.setPluginType(this.getPluginType());
        dslExecutableDTO.setJsonPathKeys(this.getJsonPathKeys());
        dslExecutableDTO.setName(this.getValidName());
        dslExecutableDTO.setCollectionId(this.getCollectionId());
        dslExecutableDTO.setClientSideExecution(this.getClientSideExecution());
        dslExecutableDTO.setConfirmBeforeExecute(this.getConfirmBeforeExecute());
        if (this.getDefaultResources() != null) {
            dslExecutableDTO.setDefaultActionId(this.getDefaultResources().getActionId());
            dslExecutableDTO.setDefaultCollectionId(this.getDefaultResources().getCollectionId());
        }

        if (this.getExecutableConfiguration() != null) {
            dslExecutableDTO.setTimeoutInMillisecond(
                    this.getExecutableConfiguration().getTimeoutInMillisecond());
        }

        return dslExecutableDTO;
    }

    @Override
    public LayoutExecutableUpdateDTO createLayoutExecutableUpdateDTO() {
        LayoutExecutableUpdateDTO layoutExecutableUpdateDTO = Executable.super.createLayoutExecutableUpdateDTO();
        layoutExecutableUpdateDTO.setCollectionId(this.getCollectionId());

        return layoutExecutableUpdateDTO;
    }

    public void autoGenerateDatasource() {
        if (this.datasource == null) {
            this.datasource = new Datasource();
            this.datasource.setIsAutoGenerated(true);
        }
    }
}
