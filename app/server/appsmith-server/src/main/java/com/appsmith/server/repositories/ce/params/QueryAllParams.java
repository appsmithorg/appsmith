package com.appsmith.server.repositories.ce.params;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.helpers.ce.bridge.BUpdate;
import com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl;
import lombok.Getter;
import lombok.NonNull;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.mongodb.core.query.Criteria;

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
    private final List<Criteria> criteria = new ArrayList<>();
    private final List<Specification<T>> specifications = new ArrayList<>();
    private final List<String> fields = new ArrayList<>();
    private AclPermission permission;
    private Set<String> permissionGroups;
    private Sort sort;
    private int limit = NO_RECORD_LIMIT;
    private int skip = NO_SKIP;

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
        ensureNoOldStyleCriteria();
        return repo.queryAllExecute(this);
    }

    public Optional<T> one() {
        ensureNoOldStyleCriteria();
        return repo.queryOneExecute(this);
    }

    public Optional<T> first() {
        ensureNoOldStyleCriteria();
        return repo.queryFirstExecute(this).blockOptional();
    }

    public Optional<Long> count() {
        ensureNoOldStyleCriteria();
        return repo.countExecute(this);
    }

    public int updateAll(@NonNull BUpdate update) {
        ensureNoOldStyleCriteria();
        scope = Scope.ALL;
        return repo.updateExecute2(this, update);
    }

    public int updateFirst(@NonNull T resource) {
        ensureNoOldStyleCriteria();
        scope = Scope.FIRST;
        return repo.updateExecute(this, resource);
    }

    public int updateFirst(@NonNull BUpdate update) {
        ensureNoOldStyleCriteria();
        scope = Scope.FIRST;
        return repo.updateExecute2(this, update);
    }

    private void ensureNoOldStyleCriteria() {
        if (!criteria.isEmpty()) {
            final var e = new RuntimeException("Operating with criteria, instead of specifications!");
            // We're eating up the exception in some places, so let's print it out for debugging ourselves.
            e.printStackTrace();
            throw e;
        }
    }

    public QueryAllParams<T> criteria(Criteria... criteria) {
        if (criteria == null) {
            return this;
        }
        return criteria(List.of(criteria));
    }

    public QueryAllParams<T> criteria(List<Criteria> criteria) {
        if (criteria == null) {
            return this;
        }
        this.criteria.addAll(criteria);
        return this;
    }

    @SuppressWarnings("unchecked") // This should be okay with the way we use this fluent API.
    public QueryAllParams<T> criteria(Specification<? extends BaseDomain> spec) {
        specifications.add((Specification<T>) spec);
        return this;
    }

    public QueryAllParams<T> byId(String id) {
        return criteria(
                id == null
                        ? (root, cq, cb) -> cb.isNull(root.get(FieldName.ID))
                        : (root, cq, cb) -> cb.equal(root.get(FieldName.ID), id));
    }

    public QueryAllParams<T> fields(String... fields) {
        return fields(List.of(fields));
    }

    public QueryAllParams<T> fields(Collection<String> fields) {
        if (fields == null) {
            return this;
        }
        this.fields.addAll(fields);
        return this;
    }

    public QueryAllParams<T> permission(AclPermission permission) {
        this.permission = permission;
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

    public enum Scope {
        ALL,
        FIRST,
        ONE,
    }
}
