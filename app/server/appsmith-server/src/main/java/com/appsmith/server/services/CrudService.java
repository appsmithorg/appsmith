package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CrudService<T extends BaseDomain, ID> {

    Flux<T> get(MultiValueMap<String, String> params);

    Mono<T> create(T resource);

    Mono<T> update(ID id, T resource);

    Mono<T> getById(ID id);

    default Mono<T> findByIdAndBranchName(ID id, String branchName) {
        return this.getById(id);
    }

    Mono<T> delete(ID id);

    default Mono<T> deleteByIdAndBranchName(ID id, String branchName) {
        return this.delete(id);
    }

    Mono<T> addPolicies(ID id, Set<Policy> policies);

    Mono<T> removePolicies(ID id, Set<Policy> policies);
}
