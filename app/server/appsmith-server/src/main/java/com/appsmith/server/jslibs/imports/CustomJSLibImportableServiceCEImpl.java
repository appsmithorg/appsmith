package com.appsmith.server.jslibs.imports;

import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Slf4j
public class CustomJSLibImportableServiceCEImpl implements ImportableServiceCE<CustomJSLib> {
    private final CustomJSLibService customJSLibService;

    public CustomJSLibImportableServiceCEImpl(CustomJSLibService customJSLibService) {
        this.customJSLibService = customJSLibService;
    }

    @Override
    public Mono<List<CustomJSLib>> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {
        List<CustomJSLib> customJSLibs = applicationJson.getCustomJSLibList();
        if (customJSLibs == null) {
            customJSLibs = new ArrayList<>();
        }

        ensureXmlParserPresenceInCustomJsLibList(customJSLibs);

        return Flux.fromIterable(customJSLibs)
                .flatMap(customJSLib -> {
                    customJSLib.setId(null);
                    customJSLib.setCreatedAt(null);
                    customJSLib.setUpdatedAt(null);
                    return customJSLibService.persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(customJSLib, false);
                })
                .collectList()
                .map(customJSLibApplicationDTOS -> {
                    mappedImportableResourcesDTO.setInstalledJsLibsList(customJSLibApplicationDTOS);
                    return List.<CustomJSLib>of();
                })
                .elapsed()
                .map(objects -> {
                    log.debug("time to import custom jslibs: {}", objects.getT1());
                    return objects.getT2();
                })
                .onErrorResume(e -> {
                    log.error("Error importing custom jslibs", e);
                    return Mono.error(e);
                });
    }

    /**
     * This method takes customJSLibList from application JSON, checks if an entry for XML parser exists,
     * otherwise adds the entry.
     * This has been done to add the xmlParser entry in imported application as appsmith is stopping native support
     * for xml parser.
     * Read More: https://github.com/appsmithorg/appsmith/pull/28012
     *
     * @param customJSLibList
     */
    private void ensureXmlParserPresenceInCustomJsLibList(List<CustomJSLib> customJSLibList) {
        boolean isXmlParserLibFound = false;
        for (CustomJSLib customJSLib : customJSLibList) {
            if (!customJSLib.getUidString().equals(ApplicationConstants.XML_PARSER_LIBRARY_UID)) {
                continue;
            }

            isXmlParserLibFound = true;
            break;
        }

        if (!isXmlParserLibFound) {
            CustomJSLib xmlParserJsLib = ApplicationConstants.getDefaultParserCustomJsLibCompatibilityDTO();
            customJSLibList.add(xmlParserJsLib);
        }
    }
}
