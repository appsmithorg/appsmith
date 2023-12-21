package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.imports.importable.ImportService;
import com.fasterxml.jackson.annotation.JsonView;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import reactor.core.publisher.Mono;

/**
 * this class is just for demonstration purpose, the specific endpoints would be
 * moved to right controller class once changes looks good to go
 */
public class PseudoImportExportControllerCE {

    private final ImportService importService;

    @Autowired
    public PseudoImportExportControllerCE(ImportService importService) {
        this.importService = importService;
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/import/{workspaceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<ImportableContextDTO>> importApplicationFromFile(
            @RequestPart("file") Mono<Part> fileMono,
            @PathVariable String workspaceId,
            @RequestParam(name = FieldName.APPLICATION_ID, required = false) String applicationId) {
        return fileMono.flatMap(file -> importService.extractAndSaveContext(workspaceId, file, applicationId))
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.OK.value(), fetchedResource, null));
    }
}
