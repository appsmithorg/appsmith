package com.appsmith.server.exports.internal;

import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import reactor.core.publisher.Mono;

public interface ExportApplicationServiceCE {

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    Mono<ApplicationJson> exportApplicationById(String applicationId, SerialiseApplicationObjective serialiseFor);

    Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName);

    Mono<ExportFileDTO> getApplicationFile(String applicationId, String branchName);
}
