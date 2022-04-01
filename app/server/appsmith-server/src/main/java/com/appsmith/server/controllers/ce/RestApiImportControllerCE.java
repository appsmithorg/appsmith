package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.TemplateCollection;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.RestApiImporterType;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApiImporter;
import com.appsmith.server.services.CurlImporterService;
import com.appsmith.server.services.PostmanImporterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

import java.util.List;


@RequestMapping(Url.IMPORT_URL)
@Slf4j
public class RestApiImportControllerCE {

    private final CurlImporterService curlImporterService;
    private final PostmanImporterService postmanImporterService;

    public RestApiImportControllerCE(CurlImporterService curlImporterService,
                                     PostmanImporterService postmanImporterService) {
        this.curlImporterService = curlImporterService;
        this.postmanImporterService = postmanImporterService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ActionDTO>> create(@RequestBody(required = false) Object input,
                                               @RequestParam RestApiImporterType type,
                                               @RequestParam String pageId,
                                               @RequestParam String name,
                                               @RequestParam String organizationId,
                                               @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                               @RequestHeader(name = "Origin", required = false) String originHeader
    ) {
        log.debug("Going to import API");
        ApiImporter service;

        switch (type) {
            case CURL:
                service = (ApiImporter) curlImporterService;
                break;
            default:
                throw new IllegalStateException("Unexpected value: " + type);
        }

        return service.importAction(input, pageId, name, organizationId, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping("/postman")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<TemplateCollection>> importPostmanCollection(@RequestBody Object input,
                                                                         @RequestParam String type) {
        return Mono.just(postmanImporterService.importPostmanCollection(input))
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("/templateCollections")
    public Mono<ResponseDTO<List<TemplateCollection>>> fetchImportedCollections() {
        return Mono.just(postmanImporterService.fetchPostmanCollections())
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @DeleteMapping("/templateCollections/{id}")
    public Mono<ResponseDTO<TemplateCollection>> deletePostmanCollection(@PathVariable String id) {
        return Mono.just(postmanImporterService.deletePostmanCollection(id))
                .map(deleted -> new ResponseDTO<>(HttpStatus.OK.value(), deleted, null));
    }

}
