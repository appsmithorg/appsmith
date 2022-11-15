package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

import javax.validation.constraints.NotNull;
import java.util.List;

public interface CustomJSLibServiceCE extends CrudService<Application, String> {
    public Mono<Boolean> addJSLibToApplication(@NotNull String applicationId, @NotNull CustomJSLib jsLib);
    public Mono<Boolean> removeJSLibFromApplication(@NotNull String applicationId,
                                                    @NotNull CustomJSLib jsLib);
    public Mono<List<CustomJSLib>> getAllJSLibsInApplication(@NotNull String applicationId);
}
