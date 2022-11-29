package com.appsmith.server.services.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Set;

public interface CustomJSLibServiceCE extends CrudService<CustomJSLib, String> {
    public Mono<Boolean> addJSLibToApplication(@NotNull String applicationId, @NotNull CustomJSLib jsLib,
                                               String branchName, Boolean isForceInstall);
    public Mono<Boolean> removeJSLibFromApplication(@NotNull String applicationId, @NotNull CustomJSLib jsLib,
                                                    String branchName, Boolean isForceInstall);
    public Mono<List<CustomJSLib>> getAllJSLibsInApplication(@NotNull String applicationId, String branchName,
                                                             Boolean isViewMode);

    Mono<Set<CustomJSLibApplicationDTO>> getAllJSLibApplicationDTOFromApplication(@NotNull String applicationId,
                                                                                  String branchName,
                                                                                  Boolean isViewMode);
}
