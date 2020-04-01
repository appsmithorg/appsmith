package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.CollectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.COLLECTION_URL)
@Slf4j
public class CollectionController extends BaseController<CollectionService, Collection, String> {
    private final ActionCollectionService actionCollectionService;

    @Autowired
    public CollectionController(CollectionService service, ActionCollectionService actionCollectionService) {
        super(service);
        this.actionCollectionService = actionCollectionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Collection>> create(@Valid @RequestBody Collection resource,
                                                @RequestHeader(name = "Origin", required = false) String originHeader) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return actionCollectionService.createCollection(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

}
