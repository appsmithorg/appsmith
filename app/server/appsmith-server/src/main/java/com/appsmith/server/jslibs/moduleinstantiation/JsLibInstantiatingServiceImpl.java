package com.appsmith.server.jslibs.moduleinstantiation;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;

@RequiredArgsConstructor
@Service
public class JsLibInstantiatingServiceImpl implements ModuleInstantiatingService<CustomJSLib, CustomJSLib> {
    private final CustomJSLibService customJSLibService;

    @Override
    public Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        Mono<List<CustomJSLib>> sourceLibsListMono = generateInstantiatedEntities(moduleInstantiatingMetaDTO);

        return sourceLibsListMono
                .flatMap(toBeInstantiatedCustomJsLibs -> customJSLibService.addHiddenJSLibsToContext(
                        moduleInstantiatingMetaDTO.getPage().getApplicationId(),
                        CreatorContextType.APPLICATION,
                        new HashSet<>(toBeInstantiatedCustomJsLibs),
                        null,
                        false))
                .then();
    }

    @Override
    public Mono<List<CustomJSLib>> generateInstantiatedEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        return customJSLibService.getAllJSLibsInContext(
                moduleInstantiatingMetaDTO.getSourcePackageId(), CreatorContextType.PACKAGE, null, true);
    }
}
