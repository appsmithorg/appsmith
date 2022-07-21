package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.Provider;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ProviderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.util.List;


@RequestMapping(Url.PROVIDER_URL)
@Slf4j
public class ProviderControllerCE extends BaseController<ProviderService, Provider, String> {
    public ProviderControllerCE(ProviderService service) {
        super(service);
    }

    @GetMapping("/categories")
    public Mono<ResponseDTO<List<String>>> getAllCategories() {
        return service.getAllCategories()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
