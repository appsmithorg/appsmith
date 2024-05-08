package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface CrudService<T extends BaseDomain, ID> {

    Mono<T> create(T resource);

    Mono<T> update(ID id, T resource);

    Mono<T> getById(ID id);

    default Mono<T> findByIdAndBranchName(ID id, String branchName) {
        return this.getById(id);
    }

    Map<String, Object> getAnalyticsProperties(T savedResource);

    Flux<T> filterByEntityFieldsWithoutPublicAccess(
            List<String> searchableEntityFields,
            String searchString,
            Pageable pageable,
            Sort sort,
            AclPermission permission);
}
