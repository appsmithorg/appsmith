package com.appsmith.server.repositories;

import com.appsmith.server.domains.ActionExecutionMetric;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ActionExecutionMetricRepository extends BaseRepository<ActionExecutionMetric, String> {
    public Flux<ActionExecutionMetric> findByActionIdAndHash(String actionId, String hash);
}
