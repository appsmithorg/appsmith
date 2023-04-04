package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.index.Indexed;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;


/**
 * TODO :
 * Move BaseDomain back to appsmith-server.domain. This is done temporarily to create templates and providers in the same database as the server
 */
@Getter
@Setter
@ToString
public abstract class BaseDomain implements Persistable<String>, AppsmithDomain, Serializable {

    private static final long serialVersionUID = 7459916000501322517L;

    @Id
    @JsonView(Views.Public.class)
    private String id;

    @JsonView(Views.Internal.class)
    @Indexed
    @CreatedDate
    protected Instant createdAt;

    @JsonView(Views.Internal.class)
    @LastModifiedDate
    protected Instant updatedAt;

    @CreatedBy
    @JsonView(Views.Public.class)
    protected String createdBy;

    @LastModifiedBy
    @JsonView(Views.Public.class)
    protected String modifiedBy;

    // Deprecating this so we can move on to using `deletedAt` for all domain models.
    @Deprecated(forRemoval = true)
    @JsonView(Views.Public.class)
    protected Boolean deleted = false;

    @JsonView(Views.Public.class)
    protected Instant deletedAt = null;

    @JsonView(Views.Internal.class)
    protected Set<Policy> policies = new HashSet<>();

    @Override
    @JsonView(Views.Public.class)
    public boolean isNew() {
        return this.getId() == null;
    }

    @JsonView(Views.Internal.class)
    public boolean isDeleted() {
        return this.getDeletedAt() != null || Boolean.TRUE.equals(getDeleted());
    }

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    // This field will be used to store the default/root resource IDs for branched resources generated for git
    // connected applications and will be used to connect resources across the branches
    @JsonView(Views.Internal.class)
    DefaultResources defaultResources;

    // This field will only be used for git related functionality to sync the action object across different instances.
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Internal.class)
    String gitSyncId;

    public void sanitiseToExportBaseObject() {
        this.setDefaultResources(null);
        this.setCreatedAt(null);
        this.setUpdatedAt(null);
        this.setUserPermissions(null);
        this.setPolicies(null);
        this.setCreatedBy(null);
        this.setModifiedBy(null);
    }
}
