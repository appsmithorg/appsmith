package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public abstract class BaseDomain implements Persistable<String>, AppsmithDomain {

    private static final long serialVersionUID = 7459916000501322517L;

    @Id
    private String id;

    @JsonIgnore
    @Indexed
    @CreatedDate
    protected Instant createdAt;

    @JsonIgnore
    @LastModifiedDate
    protected Instant updatedAt;

    @CreatedBy
    protected String createdBy;

    @LastModifiedBy
    protected String modifiedBy;

    // Deprecating this so we can move on to using `deletedAt` for all domain models.
    @Deprecated(forRemoval = true)
    protected Boolean deleted = false;

    protected Instant deletedAt = null;

    @JsonIgnore
    protected Set<Policy> policies = new HashSet<>();

    @Override
    public boolean isNew() {
        return this.getId() == null;
    }

    @JsonIgnore
    public boolean isDeleted() {
        return this.getDeletedAt() != null || Boolean.TRUE.equals(getDeleted());
    }

    @Transient
    public Set<String> userPermissions = new HashSet<>();

    // This field will be used to store the default/root resource IDs for branched resources generated for git
    // connected applications and will be used to connect resources across the branches
    @JsonIgnore
    DefaultResources defaultResources;

    // This field will only be used for git related functionality to sync the action object across different instances.
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonIgnore
    String gitSyncId;
}
