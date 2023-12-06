package com.appsmith.server.jslibs.exports;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class CustomJSLibExportableServiceCEImpl implements ExportableServiceCE<CustomJSLib> {

    private final CustomJSLibService customJSLibService;

    public CustomJSLibExportableServiceCEImpl(CustomJSLibService customJSLibService) {
        this.customJSLibService = customJSLibService;
    }

    // Directly sets required custom JS lib information in application JSON
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {
        /**
         * Since we are exporting for git, we only consider unpublished JS libraries
         * Ref: https://theappsmith.slack.com/archives/CGBPVEJ5C/p1672225134025919
         */
        return customJSLibService
                .getAllJSLibsInContext(
                        exportingMetaDTO.getApplicationId(),
                        CreatorContextType.APPLICATION,
                        exportingMetaDTO.getBranchName(),
                        false)
                .map(jsLibList -> {
                    jsLibList.forEach(CustomJSLib::sanitiseToExportDBObject);
                    return jsLibList;
                })
                .zipWith(applicationMono)
                .map(tuple2 -> {
                    Application application = tuple2.getT2();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Instant applicationLastCommittedAt =
                            gitApplicationMetadata != null ? gitApplicationMetadata.getLastCommittedAt() : null;

                    List<CustomJSLib> unpublishedCustomJSLibList = tuple2.getT1();
                    Set<String> updatedCustomJSLibSet;
                    if (applicationLastCommittedAt != null) {
                        updatedCustomJSLibSet = unpublishedCustomJSLibList.stream()
                                .filter(lib -> lib.getUpdatedAt() == null
                                        || applicationLastCommittedAt.isBefore(lib.getUpdatedAt()))
                                .map(lib -> lib.getUidString())
                                .collect(Collectors.toSet());
                    } else {
                        updatedCustomJSLibSet = unpublishedCustomJSLibList.stream()
                                .map(lib -> lib.getUidString())
                                .collect(Collectors.toSet());
                    }
                    applicationJson.getUpdatedResources().put(FieldName.CUSTOM_JS_LIB_LIST, updatedCustomJSLibSet);

                    /**
                     * Previously it was a Set and as Set is an unordered collection of elements that
                     * resulted in uncommitted changes. Making it a list and sorting it by the UidString
                     * ensure that the order will be maintained. And this solves the issue.
                     */
                    Collections.sort(unpublishedCustomJSLibList, Comparator.comparing(CustomJSLib::getUidString));
                    applicationJson.setCustomJSLibList(unpublishedCustomJSLibList);
                    return unpublishedCustomJSLibList;
                })
                .then();
    }
}
