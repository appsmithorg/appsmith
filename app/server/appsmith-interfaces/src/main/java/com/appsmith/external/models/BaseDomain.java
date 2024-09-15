package com.appsmith.external.models;

import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.util.CollectionUtils;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * TODO :
 * Move BaseDomain back to appsmith-server.domain. This is done temporarily to create templates and providers in the same database as the server
 */
@Getter
@Setter
@ToString
@FieldNameConstants
public abstract class BaseDomain implements Persistable<String>, AppsmithDomain, Serializable, Identifiable {

    private static final long serialVersionUID = 7459916000501322517L;

    @Id
    @JsonView({Views.Public.class, FromRequest.class, Git.class})
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

    /** @deprecated to rely only on `deletedAt` for all domain models.
     * This field only exists here because its removal will cause a huge diff on all entities in git-connected
     * applications. So, instead, we keep it, deprecated, query-transient (no corresponding field in Q* class),
     * no getter/setter methods and only use it for reflection-powered services, like the git sync
     * implementation. For all other practical purposes, this field doesn't exist.
     */
    @Deprecated(forRemoval = true)
    @JsonView(Views.Internal.class)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    protected Boolean deleted = false;

    @JsonView(Views.Public.class)
    protected Instant deletedAt = null;

    @JsonView(Views.Internal.class)
    protected Map<String, Policy> policyMap = new HashMap<>();

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
        return policyMap == null ? Set.of() : Set.copyOf(policyMap.values());
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
            this.setId(new ObjectId().toString());
        }
        if (this.getCreatedAt() == null) {
            this.setCreatedAt(Instant.now());
        }
        this.setUpdatedAt(Instant.now());
    }

    public static class Fields {}
}
