package com.appsmith.server.repositories.ce.params;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl;
import lombok.Getter;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

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

    public QueryAllParams(BaseAppsmithRepositoryCEImpl<T> repo) {
        this.repo = repo;
    }

    public List<T> all() {
        return repo.queryAllExecute(this);
    }

    public Optional<T> one() {
        return repo.queryOneExecute(this);
    }

    public Optional<T> first() {
        return repo.queryFirstExecute(this).blockOptional();
    }

    public Mono<Long> count() {
        return repo.countExecute(this);
    }

    public QueryAllParams<T> criteria(Criteria... criteria) {
        if (criteria == null) {
            return this;
        }
        return criteria(List.of(criteria));
    }

    public QueryAllParams<T> criteria(List<Criteria> criterias) {
        if (criterias == null) {
            return this;
        }
        this.criteria.addAll(criterias);
        return this;
    }

    public QueryAllParams<T> spec(Specification<T> spec) {
        specifications.add(spec);
        return this;
    }

    public QueryAllParams<T> byId(String id) {
        spec(
                id == null
                        ? (root, cq, cb) -> cb.isNull(root.get(FieldName.ID))
                        : (root, cq, cb) -> cb.equal(root.get(FieldName.ID), id));
        return this;
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
}
