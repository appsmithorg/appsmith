package com.appsmith.server.jslibs.exportable;

import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class CustomJSLibExportableServiceCEImpl implements ExportableServiceCE<CustomJSLib> {

    protected final ArtifactBasedExportableService<CustomJSLib, Application> applicationExportableService;

    @Override
    public ArtifactBasedExportableService<CustomJSLib, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        return applicationExportableService;
    }

    // Directly sets required custom JS lib information in artifact JSON
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ArtifactBasedExportableService<CustomJSLib, ?> artifactBasedExportableService =
                getArtifactBasedExportableService(exportingMetaDTO);
        /**
         * Since we are exporting for git, we only consider unpublished JS libraries
         * Ref: https://theappsmith.slack.com/archives/CGBPVEJ5C/p1672225134025919
         */
        return exportableArtifactMono
                .map(Artifact::getId)
                .flatMapMany(artifactId ->
                        artifactBasedExportableService.findByContextIdsForExport(List.of(artifactId), null))
                .collectList()
                .map(jsLibList -> {
                    jsLibList.forEach(CustomJSLib::sanitiseToExportDBObject);
                    return jsLibList;
                })
                .zipWith(exportableArtifactMono)
                .map(tuple2 -> {
                    Artifact exportableArtifact = tuple2.getT2();
                    GitArtifactMetadata gitArtifactMetadata = exportableArtifact.getGitArtifactMetadata();
                    Instant artifactLastCommittedAt =
                            gitArtifactMetadata != null ? gitArtifactMetadata.getLastCommittedAt() : null;

                    List<CustomJSLib> unpublishedCustomJSLibList = tuple2.getT1();
                    Set<String> updatedCustomJSLibSet;
                    if (artifactLastCommittedAt != null) {
                        updatedCustomJSLibSet = unpublishedCustomJSLibList.stream()
                                .filter(lib -> lib.getUpdatedAt() == null
                                        || artifactLastCommittedAt.isBefore(lib.getUpdatedAt()))
                                .map(lib -> lib.getUidString())
                                .collect(Collectors.toSet());
                    } else {
                        updatedCustomJSLibSet = unpublishedCustomJSLibList.stream()
                                .map(lib -> lib.getUidString())
                                .collect(Collectors.toSet());
                    }
                    artifactExchangeJson
                            .getModifiedResources()
                            .putResource(FieldName.CUSTOM_JS_LIB_LIST, updatedCustomJSLibSet);
                    artifactExchangeJson
                            .getModifiedResources()
                            .getModifiedResourceIdentifiers()
                            .get(GitResourceType.JSLIB_CONFIG)
                            .addAll(updatedCustomJSLibSet);

                    /**
                     * Previously it was a Set and as Set is an unordered collection of elements that
                     * resulted in uncommitted changes. Making it a list and sorting it by the UidString
                     * ensure that the order will be maintained. And this solves the issue.
                     */
                    Collections.sort(unpublishedCustomJSLibList, Comparator.comparing(CustomJSLib::getUidString));
                    artifactExchangeJson.setCustomJSLibList(unpublishedCustomJSLibList);
                    return unpublishedCustomJSLibList;
                })
                .then();
    }

    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson,
            Boolean isContextAgnostic) {
        return getExportableEntities(
                exportingMetaDTO, mappedExportableResourcesDTO, exportableArtifactMono, artifactExchangeJson);
    }
}
