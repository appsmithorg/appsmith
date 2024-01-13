package com.appsmith.server.dtos;

import lombok.Data;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Data
public class RefactoringMetaDTO {

    Mono<Integer> evalVersionMono;
    Mono<PageDTO> pageDTOMono;
    Pattern oldNamePattern;

    Set<String> updatedBindingPaths = new HashSet<>();
    PageDTO updatedPage;

    Set<String> updatableCollectionIds = new HashSet<>();
}
