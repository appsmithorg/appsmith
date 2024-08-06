package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.services.CrudService;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface CustomJSLibServiceCE extends CrudService<CustomJSLib, String> {
    Mono<Boolean> addJSLibsToContext(
            @NotNull String branchedContextId,
            CreatorContextType contextType,
            Set<CustomJSLib> jsLibs,
            Boolean isForceInstall);

    Mono<Boolean> removeJSLibFromContext(
            @NotNull String branchedContextId,
            CreatorContextType contextType,
            @NotNull CustomJSLib jsLib,
            Boolean isForceRemove);

    Mono<List<CustomJSLib>> getAllJSLibsInContext(
            @NotNull String branchedContextId, CreatorContextType contextType, Boolean isViewMode);

    Mono<CustomJSLibContextDTO> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(
            CustomJSLib jsLib, Boolean isForceInstall);

    Mono<CustomJSLibContextDTO> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(
            CustomJSLib jsLib,
            Boolean isForceInstall,
            Map<DBOpsType, List<CustomJSLib>> customJSLibsDryOps,
            boolean isDryOps);

    Flux<CustomJSLib> getAllVisibleJSLibsInContext(
            @NotNull String branchedContextId, CreatorContextType contextType, String branchName, Boolean isViewMode);
}
