package com.appsmith.external.models;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.domain.Persistable;
import org.springframework.util.CollectionUtils;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * TODO :
 * Move BaseDomain back to appsmith-server.domain. This is done temporarily to create templates and providers in the same database as the server
 */
@Getter
@Setter
@ToString
@FieldNameConstants
@MappedSuperclass
// @EntityListeners(EncryptionEntityListener.class) // May be not needed, but keeping as we may need to revisit _very_
// soon.
public abstract class BaseDomain implements Persistable<String>, AppsmithDomain, Serializable, Identifiable {

    private static final long serialVersionUID = 7459916000501322517L;

    @Id
    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    protected String id;

    @JsonView(Views.Internal.class)
    @CreationTimestamp
    protected Instant createdAt;

    @JsonView(Views.Internal.class)
    @UpdateTimestamp
    protected Instant updatedAt;

    @CreatedBy
    @JsonView(Views.Public.class)
    protected String createdBy;

    @LastModifiedBy
    @JsonView(Views.Public.class)
    protected String modifiedBy;

    @JsonView(Views.Public.class)
    protected Instant deletedAt = null;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView(Views.Internal.class)
    protected Map<String, Policy> policyMap = new HashMap<>();

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView({Views.Internal.class})
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    protected Set<Policy> policies = new HashSet<>();

    @Override
    @JsonIgnore
    public boolean isNew() {
        return this.getId() == null;
    }

    @JsonView(Views.Internal.class)
    public boolean isDeleted() {
        return deletedAt != null;
    }

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    // TODO Abhijeet: Remove this method once we have migrated all the usages of policies to policyMap
    /**
     * An unmodifiable set of policies.
     */
    @JsonView({Views.Internal.class})
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    public Set<Policy> getPolicies() {
        if (!CollectionUtils.isEmpty(policies)) {
            return policies;
        }
        return policyMap == null ? null : Set.copyOf(policyMap.values());
    }

    // TODO Abhijeet: Remove this method once we have migrated all the usages of policies to policyMap
    @JsonView({Views.Internal.class})
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    public void setPolicies(Set<Policy> policies) {
        setPolicies(policies, true);
    }

    /**
     * This method is used to set the policies and policyMap field if required. This acts as a backward compatible
     * method till we replace direct assignment to policyMap field. By default, from the codebase we expect that the
     * policyMap field should have all elements from policies, but the same is not true when triggered it from startup
     * migrations till {@link Migration059PolicySetToPolicyMap} is executed. This is because we update the policies via:
     * 1. The setter method
     * 2. Direct assignment to the field (check {@link Migration042AddPermissionsForGitOperations})
     * The 2nd use-case is what makes it difficult to track and update policies in migrations. We thought of updating
     * the policyMaps as well during these direct assignments but that would mean we are altering existing migrations
     * which leaves the room for errors and is not a good practice.
     *
     * @param policies                  The set of policies to be set
     * @param shouldUpdatePolicyMap     A boolean flag to decide if the policyMap field should be updated
     */
    @JsonView({Views.Internal.class})
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    public void setPolicies(Set<Policy> policies, boolean shouldUpdatePolicyMap) {
        this.policies = policies;
        if (shouldUpdatePolicyMap) {
            this.policyMap = policySetToMap(policies);
        }
    }

    public static Map<String, Policy> policySetToMap(Set<Policy> policies) {
        if (policies == null) {
            return null;
        }
        Map<String, Policy> policyMap = new HashMap<>();
        for (Policy policy : policies) {
            policyMap.put(policy.getPermission(), policy);
        }
        return policyMap;
    }

    public void sanitiseToExportDBObject() {
        this.setCreatedAt(null);
        this.setUpdatedAt(null);
        this.setUserPermissions(null);
        this.setPolicies(null);
        this.setCreatedBy(null);
        this.setModifiedBy(null);
    }

    public void makePristine() {
        // Set the ID to null for this domain object so that it is saved a new document in the database (as opposed to
        // updating an existing document). If it contains any policies, they are also reset.
        this.setId(null);
        this.setUpdatedAt(null);
        if (this.getPolicyMap() != null) {
            this.getPolicyMap().clear();
        }
        if (this.getPolicies() != null) {
            this.policies = new HashSet<>();
        }
    }

    /**
     * Prepares the domain for bulk write operation. It does the following:
     * 1. Populate an ID if it is not present
     * 2. Populate the createdAt and updatedAt fields as they'll not be generated by the bulk insert process
     */
    public void updateForBulkWriteOperation() {
        if (this.getId() == null) {
            this.setId(UUID.randomUUID().toString());
        }
        if (this.getCreatedAt() == null) {
            this.setCreatedAt(Instant.now());
        }
        this.setUpdatedAt(Instant.now());
    }

    @PrePersist
    @PreUpdate
    public void preSave() {
        if (id == null) {
            // TODO: Use custom generation strategy instead of this.
            setId(UUID.randomUUID().toString());
        }
    }

    public static class Fields {}
}
