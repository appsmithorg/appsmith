package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.PartialImportExportDTO;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class PartialImportExportServiceCEImpl implements PartialImportExportServiceCE {
    private final ImportExportApplicationService importExportApplicationService;

    public Mono<ApplicationJson> exportPartialApplicationById(String applicationId, PartialImportExportDTO entities) {
        return Mono.just(new ApplicationJson());
    }

    public Mono<ExportFileDTO> getPartialApplicationFile(String applicationId, PartialImportExportDTO entities) {
        return Mono.just(new ExportFileDTO());
    }

    public Mono<ApplicationImportDTO> importPartialApplicationFromJson(String applicationId, String pageId, Part importedDoc) {
        return Mono.just(new ApplicationImportDTO());
    }

}
