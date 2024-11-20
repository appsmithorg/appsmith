package com.appsmith.server.repositories.ce.params;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl;
import jakarta.persistence.EntityManager;
import lombok.Getter;
import lombok.NonNull;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.NO_RECORD_LIMIT;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.NO_SKIP;

@Getter
public class QueryAllParams<T extends BaseDomain> {
    // TODO(Shri): There's a cyclic dependency between the repository and this class. Remove it.
    private final BaseAppsmithRepositoryCEImpl<T> repo;
    private final List<Specification<T>> specifications = new ArrayList<>();

    @Deprecated
    private final List<String> fields = new ArrayList<>();

    private AclPermission permission;
    private Set<String> permissionGroups;
    private Sort sort;
    private int limit = NO_RECORD_LIMIT;
    private int skip = NO_SKIP;
    private User user;
    private EntityManager entityManager;

    /**
     * When this flag is true, permission checks will include the affects of anonymous user permissions. This is the
     * default and very-usually, what we want. When it's false, we are only checking for the permissions of the user.
     */
    private boolean includeAnonymousUserPermissions = true;

    private Scope scope;

    public QueryAllParams(BaseAppsmithRepositoryCEImpl<T> repo) {
        this.repo = repo;
    }

    public List<T> all() {
        return repo.queryAllExecute(this);
    }

    public <P> List<P> all(Class<P> projectionClass) {
        return repo.queryAllExecute(this, projectionClass);
    }

    public Optional<T> one() {
        return repo.queryOneExecute(this);
    }

    public <P> Optional<P> one(Class<P> projectionClass) {
        return repo.queryOneExecute(this, projectionClass);
    }

    public Optional<T> first() {
        return repo.queryFirstExecute(this);
    }

    public Optional<Long> count() {
        return repo.countExecute(this);
    }

    public int updateAll(@NonNull BridgeUpdate update) {
        scope = Scope.ALL;
        return repo.updateExecute(this, update);
    }

    public int updateFirst(@NonNull T resource) {
        scope = Scope.FIRST;
        return repo.updateExecute(this, resource);
    }

    public int updateFirst(@NonNull BridgeUpdate update) {
        scope = Scope.FIRST;
        return repo.updateExecute(this, update);
    }

    @SuppressWarnings("unchecked") // This should be okay with the way we use this fluent API.
    public QueryAllParams<T> criteria(Specification<? extends BaseDomain> spec) {
        // TODO: Check if we can use reflection to ensure this typecast is valid.
        specifications.add((Specification<T>) spec);
        return this;
    }

    public QueryAllParams<T> byId(String id) {
        return criteria(
                id == null
                        ? (root, cq, cb) -> cb.isNull(root.get(FieldName.ID))
                        : (root, cq, cb) -> cb.equal(root.get(FieldName.ID), id));
    }

    /**
     * @deprecated Use class based projections instead.
     * Refer to {@link #all(Class)} and {@link #one(Class)}.
     * @param fields
     * @return
     */
    @Deprecated(forRemoval = true)
    public QueryAllParams<T> fields(String... fields) {
        return fields(List.of(fields));
    }

    /**
     * @deprecated Use class based projections instead.
     * Refer to {@link #all(Class)} and {@link #one(Class)}.
     * @param fields
     * @return
     */
    @Deprecated(forRemoval = true)
    public QueryAllParams<T> fields(Collection<String> fields) {
        if (fields == null) {
            return this;
        }
        this.fields.addAll(fields);
        return this;
    }

    public QueryAllParams<T> permission(AclPermission permission, User user) {
        this.permission = permission;
        this.user = user;
        return this;
    }

    public QueryAllParams<T> permissionGroups(Set<String> permissionGroups) {
        this.permissionGroups = permissionGroups;
        return this;
    }

    public QueryAllParams<T> sort(Sort sort) {
        this.sort = sort;
        return this;
    }

    public QueryAllParams<T> limit(int limit) {
        this.limit = limit;
        return this;
    }

    public QueryAllParams<T> skip(int skip) {
        this.skip = skip;
        return this;
    }

    public QueryAllParams<T> includeAnonymousUserPermissions(boolean value) {
        includeAnonymousUserPermissions = value;
        return this;
    }

    public QueryAllParams<T> entityManager(EntityManager entityManager) {
        this.entityManager = entityManager;
        return this;
    }

    public enum Scope {
        ALL,
        FIRST,
        ONE,
    }
}
