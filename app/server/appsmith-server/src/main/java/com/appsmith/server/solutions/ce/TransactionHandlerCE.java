package com.appsmith.server.solutions.ce;

import com.appsmith.server.aspect.TransactionAspect;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.function.Consumer;

public interface TransactionHandlerCE {
    Mono<Void> cleanUpDatabase(Map<String, TransactionAspect.DBOps> entityMap);

    Mono<Void> processEntitiesAndUpdateDBState(Map<String, TransactionAspect.DBOps> entityMap);

    void populateEntityData(Map<String, TransactionAspect.DBOps> entityMap);

    <T> void processEntity(
            T entity,
            Map<String, TransactionAspect.DBOps> entityMap,
            Consumer<String> archiveMethod,
            Consumer<T> saveMethod);

    String getEntityId(Object entity);
}
