package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.newactions.projections.IdAndDatasourceIdNewActionView;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewActionRepository;
import org.springframework.data.mongodb.repository.Meta;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NewActionRepositoryCE extends BaseRepository<NewAction, String>, CustomNewActionRepository {

    @Meta(cursorBatchSize = 10000)
    Flux<NewAction> findByApplicationId(String applicationId);

    @Meta(cursorBatchSize = 10000)
    Flux<NewAction> findAllByIdIn(Iterable<String> ids);

    Mono<Long> countByDeletedAtNull();

    Flux<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds);

    Flux<IdAndDatasourceIdNewActionView> findIdAndDatasourceIdByApplicationIdIn(List<String> applicationIds);
}
