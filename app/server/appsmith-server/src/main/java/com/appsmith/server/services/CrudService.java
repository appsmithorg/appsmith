package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface CrudService<T extends BaseDomain, ID> {

    Flux<T> get(MultiValueMap<String, String> params);

    Mono<T> create(T resource);

    Mono<T> update(ID id, T resource);

    Mono<T> getById(ID id);

    default Mono<T> findByIdAndBranchName(ID id, String branchName) {
        return this.getById(id);
    }

    Mono<T> archiveById(ID id);

    default Mono<T> archiveByIdAndBranchName(ID id, String branchName) {
        return this.archiveById(id);
    }

    Map<String, Object> getAnalyticsProperties(T savedResource);

}
