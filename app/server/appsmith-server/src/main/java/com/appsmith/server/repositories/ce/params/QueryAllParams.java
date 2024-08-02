package com.appsmith.server.repositories.ce.params;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl;
import lombok.Getter;
import lombok.NonNull;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.NO_RECORD_LIMIT;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.NO_SKIP;

@Getter
public class QueryAllParams<T extends BaseDomain> {
    // TODO(Shri): There's a cyclic dependency between the repository and this class. Remove it.
    private final BaseAppsmithRepositoryCEImpl<T> repo;
    private final List<Criteria> criteria = new ArrayList<>();

    @Deprecated
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

    public Flux<T> all() {
        return repo.queryAllExecute(this);
    }

    public <P> Flux<P> all(Class<P> projectionClass) {
        return repo.queryAllExecute(this, projectionClass);
    }

    public Mono<T> one() {
        return repo.queryOneExecute(this);
    }

    public <P> Mono<P> one(Class<P> projectionClass) {
        return repo.queryOneExecute(this, projectionClass);
    }

    public Mono<T> first() {
        return repo.queryFirstExecute(this);
    }

    public Mono<Long> count() {
        return repo.countExecute(this);
    }

    public Mono<Integer> updateAll(@NonNull UpdateDefinition update) {
        scope = Scope.ALL;
        return repo.updateExecute(this, update);
    }

    public Mono<Integer> updateFirst(@NonNull T resource) {
        scope = Scope.FIRST;
        return repo.updateExecute(this, resource);
    }

    public Mono<Integer> updateFirst(@NonNull UpdateDefinition update) {
        scope = Scope.FIRST;
        return repo.updateExecute(this, update);
    }

    public QueryAllParams<T> criteria(Criteria c) {
        if (c == null) {
            return this;
        }

        if (c instanceof BridgeQuery<?> bq && bq.isEmpty()) {
            // Empty bridge criteria leads to subtle bugs. Just don't call `.criteria()` in such cases.
            // So ignore it and act as if this method hasn't been called at all, because there's some styles of using
            // this API that make such use just so convenient.
            return this;
        }

        criteria.add(c);
        return this;
    }

    public QueryAllParams<T> byId(String id) {
        final Criteria w = Criteria.where(FieldName.ID);
        return criteria(id == null ? w.isNull() : w.is(id));
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
