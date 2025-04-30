package com.appsmith.external.models.ce;

import com.appsmith.external.constants.ActionCreationSourceTypeEnum;
import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Documentation;
import com.appsmith.external.models.EntityReferenceType;
import com.appsmith.external.models.Executable;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.annotation.Transient;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
@FieldNameConstants
public class ActionCE_DTO implements Identifiable, Executable {

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    private String id;

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    private String baseId;

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    String applicationId;

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    String workspaceId;

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    PluginType pluginType;

    // name of the plugin. used to log analytics events where pluginName is a required attribute
    // It'll be null if not set
    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    String pluginName;

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    String pluginId;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String name;

    // The FQN for an action will also include any collection it is a part of as collectionName.actionName
    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String fullyQualifiedName;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    Datasource datasource;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String pageId;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    CreatorContextType contextType;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String collectionId;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    ActionConfiguration actionConfiguration;

    // this attribute carries error messages while processing the actionCollection
    @Transient
    @JsonView(Views.Public.class)
    List<ErrorDTO> errorReports;

    /**
     * @deprecated This field is deprecated and will be removed in a future release.
     * Use runBehaviour instead.
     */
    @Deprecated
    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    Boolean executeOnLoad;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    RunBehaviourEnum runBehaviour;

    public RunBehaviourEnum getRunBehaviour() {
        if (runBehaviour != null) {
            return runBehaviour;
        }
        if (executeOnLoad != null) {
            return executeOnLoad ? RunBehaviourEnum.ON_PAGE_LOAD : RunBehaviourEnum.MANUAL;
        } else {
            return RunBehaviourEnum.MANUAL;
        }
    }

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    Boolean clientSideExecution;

    /*
     * This is a list of fields specified by the client to signify which fields have dynamic bindings in them.
     * TODO: The server can use this field to simplify our Mustache substitutions in the future
     */
    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    List<Property> dynamicBindingPathList;

    @JsonView(Views.Public.class)
    Boolean isValid;

    @JsonView(Views.Public.class)
    Set<String> invalids;

    @Transient
    @JsonView(Views.Public.class)
    Set<String> messages = new HashSet<>();

    // This is a list of keys that the client whose values the client needs to send during action execution.
    // These are the Mustache keys that the server will replace before invoking the API
    @JsonView(Views.Public.class)
    Set<String> jsonPathKeys;

    @JsonView(Views.Internal.class)
    String cacheResponse;

    @JsonView({Views.Internal.class, Git.class})
    Boolean userSetOnLoad = false;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    Boolean confirmBeforeExecute = false;

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    Documentation documentation;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView({Views.Public.class, FromRequest.class})
    Instant deletedAt = null;

    @Deprecated
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView({Views.Public.class, FromRequest.class})
    Instant archivedAt = null;

    @Transient
    @JsonView(Views.Internal.class)
    protected Map<String, Policy> policyMap = new HashMap<>();

    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    public Set<String> userPermissions = new HashSet<>();

    @JsonView(Views.Internal.class)
    protected Instant createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    protected Instant updatedAt;

    // Defines what triggered action creation, could be self (user explicitly created action) / generate crud / one
    // click binding etc
    // Used in logging create action event
    @Transient
    @JsonView({Views.Public.class, FromRequest.class})
    ActionCreationSourceTypeEnum source;

    @Transient
    @JsonView({Views.Internal.class})
    private RefType refType;

    @Transient
    @JsonView({Views.Internal.class})
    private String refName;

    // TODO Abhijeet: Remove this method once we have migrated all the usages of policies to policyMap
    /**
     * An unmodifiable set of policies.
     */
    @JsonView(Views.Internal.class)
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    public Set<Policy> getPolicies() {
        return policyMap == null ? null : Set.copyOf(policyMap.values());
    }

    @JsonView(Views.Internal.class)
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    public void setPolicies(Set<Policy> policies) {
        if (policies == null) {
            this.policyMap = null;
            return;
        }
        policyMap = new HashMap<>();
        for (Policy policy : policies) {
            policyMap.put(policy.getPermission(), policy);
        }
    }

    @Override
    @JsonView({Views.Internal.class})
    public String getValidName() {
        if (StringUtils.hasText(this.fullyQualifiedName)) {
            return this.fullyQualifiedName;
        }

        return this.name;
    }

    @Override
    @JsonView({Views.Internal.class})
    public Set<String> getExecutableNames() {
        String validName = this.getValidName();
        HashSet<String> validNames = new HashSet<>();
        if (validName != null) {
            validNames.add(validName);
        }
        return validNames;
    }

    @Override
    public String getUserExecutableName() {
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
        this.resetTransientFields();
        this.setUpdatedAt(null);
        this.setCacheResponse(null);
        if (this.getDatasource() != null) {
            this.getDatasource().setCreatedAt(null);
            this.getDatasource().setDatasourceStorages(null);
        }
        if (this.getUserPermissions() != null) {
            this.getUserPermissions().clear();
        } else {
            this.setUserPermissions(Set.of());
        }
        if (this.getPolicyMap() != null) {
            this.getPolicyMap().clear();
        } else {
            this.setPolicyMap(Map.of());
        }
    }

    @Override
    @JsonView({Views.Internal.class})
    public Set<String> getSelfReferencingDataPaths() {
        if (this.getActionConfiguration() == null) {
            return new HashSet<>();
        }
        return this.getActionConfiguration().getSelfReferencingDataPaths();
    }

    @Override
    @JsonView({Views.Internal.class})
    public ActionConfiguration getExecutableConfiguration() {
        return this.getActionConfiguration();
    }

    @Override
    @JsonView({Views.Internal.class})
    public String getConfigurationPath() {
        return this.getUserExecutableName() + ".actionConfiguration";
    }

    @Override
    @JsonView({Views.Internal.class})
    public String getCompleteDynamicBindingPath(String fieldPath) {
        return this.getConfigurationPath() + "." + fieldPath;
    }

    @Override
    @JsonView({Views.Internal.class})
    public boolean hasExtractableBinding() {
        return PluginType.JS.equals(this.getPluginType());
    }

    @Override
    @JsonView({Views.Internal.class})
    public DslExecutableDTO getDslExecutable() {
        DslExecutableDTO dslExecutableDTO = new DslExecutableDTO();

        dslExecutableDTO.setId(this.getId());
        dslExecutableDTO.setPluginType(this.getPluginType());
        dslExecutableDTO.setJsonPathKeys(this.getJsonPathKeys());
        dslExecutableDTO.setName(this.getValidName());
        dslExecutableDTO.setCollectionId(this.getCollectionId());
        dslExecutableDTO.setClientSideExecution(this.getClientSideExecution());
        dslExecutableDTO.setConfirmBeforeExecute(this.getConfirmBeforeExecute());

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

    @Override
    public Boolean isOnLoadMessageAllowed() {
        return true;
    }

    public void autoGenerateDatasource() {
        if (this.datasource == null) {
            this.datasource = new Datasource();
            this.datasource.setIsAutoGenerated(true);
        }
    }

    protected void resetTransientFields() {
        this.setId(null);
        this.setBaseId(null);
        this.setApplicationId(null);
        this.setWorkspaceId(null);
        this.setPluginId(null);
        this.setPluginName(null);
        this.setPluginType(null);
        this.setErrorReports(null);
        this.setDocumentation(null);
        this.setSource(null);
    }

    public String calculateContextId() {
        return this.getPageId();
    }

    public void setContextId(String contextId) {
        this.pageId = contextId;
    }

    public static class Fields {}

    @JsonIgnore
    public String getArtifactId() {
        return this.getApplicationId();
    }

    @JsonIgnore
    public String getContextId() {
        return this.getPageId();
    }
}
