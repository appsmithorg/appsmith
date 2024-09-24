package com.appsmith.server.exports.internal;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.exports.internal.artifactbased.ArtifactBasedExportService;
import reactor.core.publisher.Mono;

public interface ExportServiceCE {

    ArtifactBasedExportService<?, ?> getContextBasedExportService(ArtifactType artifactType);

    Mono<? extends ArtifactExchangeJson> exportByExportableArtifactIdAndBranchName(
            String artifactId, String branchName, SerialiseArtifactObjective objective, ArtifactType artifactType);

    /**
     * This function will give the artifact the resources to rebuild the artifact in import artifact flow
     *
     * @param artifactId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    Mono<? extends ArtifactExchangeJson> exportByArtifactId(
            String artifactId, SerialiseArtifactObjective objective, ArtifactType artifactType);

    Mono<? extends ArtifactExchangeJson> exportByArtifactIdAndBranchName(
            String artifactId, String branchName, ArtifactType artifactType);

    Mono<ExportFileDTO> getArtifactFile(String branchedArtifactId, ArtifactType artifactType);
}
