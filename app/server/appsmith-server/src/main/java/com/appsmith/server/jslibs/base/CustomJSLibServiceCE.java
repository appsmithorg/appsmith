package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.services.CrudService;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomJSLibServiceCE extends CrudService<CustomJSLib, String> {
    Mono<Boolean> addJSLibToContext(
            @NotNull String contextId,
            CreatorContextType contextType,
            @NotNull CustomJSLib jsLib,
            String branchName,
            Boolean isForceInstall);

    Mono<Boolean> removeJSLibFromContext(
            @NotNull String contextId,
            CreatorContextType contextType,
            @NotNull CustomJSLib jsLib,
            String branchName,
            Boolean isForceRemove);

    Mono<List<CustomJSLib>> getAllJSLibsInContext(
            @NotNull String contextId, CreatorContextType contextType, String branchName, Boolean isViewMode);

    Mono<CustomJSLibContextDTO> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(
            CustomJSLib jsLib, Boolean isForceInstall);
}
