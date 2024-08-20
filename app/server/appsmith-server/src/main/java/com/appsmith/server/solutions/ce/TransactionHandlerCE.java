package com.appsmith.server.solutions.ce;

import com.appsmith.server.aspect.TransactionAspect;
import com.appsmith.server.dtos.TransactionHandlerDTO;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.function.Consumer;

public interface TransactionHandlerCE {
    Mono<Void> cleanUpDatabase(Map<String, TransactionAspect.DBOps> entityMap);

    Mono<Void> processEntitiesAndUpdateDBState(
            Map<String, TransactionAspect.DBOps> entityMap, TransactionHandlerDTO transactionHandlerDTO);

    Mono<Void> populateEntityData(
            Map<String, TransactionAspect.DBOps> entityMap, TransactionHandlerDTO transactionHandlerDTO);

    <T> void processEntity(
            T entity,
            Map<String, TransactionAspect.DBOps> entityMap,
            Consumer<String> archiveMethod,
            Consumer<T> saveMethod);

    String getEntityId(Object entity);
}
