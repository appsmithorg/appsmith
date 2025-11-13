package com.appsmith.server.dtos;

import lombok.Data;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Data
public class RefactoringMetaDTO {

    Mono<Integer> evalVersionMono;
    Mono<PageDTO> pageDTOMono;
    Pattern oldNamePattern;

    /**
     * Thread-safe set for tracking binding paths that have been updated during refactoring.
     * Uses ConcurrentHashMap.newKeySet() to ensure thread-safety as this collection can be
     * modified concurrently by multiple refactoring services during reactive operations.
     */
    Set<String> updatedBindingPaths = ConcurrentHashMap.newKeySet();

    PageDTO updatedPage;

    /**
     * Thread-safe set for tracking action collection IDs that need to be updated during refactoring.
     * Uses ConcurrentHashMap.newKeySet() to ensure thread-safety as this collection can be
     * modified concurrently by multiple refactoring services during reactive operations.
     */
    Set<String> updatableCollectionIds = ConcurrentHashMap.newKeySet();
}
