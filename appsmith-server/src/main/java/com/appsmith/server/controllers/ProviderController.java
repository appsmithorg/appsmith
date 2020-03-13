package com.appsmith.server.controllers;

import com.appsmith.external.models.Provider;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ProviderService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping(Url.PROVIDER_URL)
public class ProviderController extends BaseController<ProviderService, Provider, String> {

    public ProviderController(ProviderService service) {
        super(service);
    }

    @GetMapping("/categories")
    public Mono<ResponseDTO<List<String>>> getAllCategories() {
        return service.getAllCategories()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
