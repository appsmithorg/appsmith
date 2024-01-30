package com.appsmith.server.exports.exportable;

import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.exports.internal.ContextBasedExportService;
import reactor.core.publisher.Mono;

public interface ExportServiceCE {

    ContextBasedExportService<?, ?> getContextBasedExportService(ArtifactJsonType artifactJsonType);

    Mono<? extends ArtifactExchangeJson> exportByExportableArtifactIdAndBranchName(
            String artifactId,
            String branchName,
            SerialiseArtifactObjective objective,
            ArtifactJsonType artifactJsonType);

    /**
     * This function will give the artifact the resources to rebuild the artifact in import artifact flow
     *
     * @param artifactId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    Mono<? extends ArtifactExchangeJson> exportByArtifactId(
            String artifactId, SerialiseArtifactObjective objective, ArtifactJsonType artifactJsonType);

    Mono<? extends ArtifactExchangeJson> exportByArtifactIdAndBranchName(
            String artifactId, String branchName, ArtifactJsonType artifactJsonType);

    Mono<ExportFileDTO> getArtifactFile(String artifactId, String branchName, ArtifactJsonType artifactJsonType);
}
