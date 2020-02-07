package com.appsmith.server.controllers;

import com.appsmith.external.models.Provider;
import com.appsmith.external.models.Statistics;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(Url.PROVIDER_URL)
public class ProviderController {

    @GetMapping
    Mono<ResponseDTO<List<Provider>>> fetchProviders(@RequestParam(required = false) String categoryName, @RequestParam(required = false) String pageNo) {
        Provider provider = new Provider();
        List<String> categories = new ArrayList<>();
        categories.add("Data");
        categories.add("Sports");
        provider.setCategories(categories);
        provider.setName("New Sports Ltd");
        provider.setId("RandomSavedId");
        provider.setDescription("Some description here");
        provider.setUrl("http://url.com");
        provider.setImageUrl("http://image.url.com");
        provider.setDocumentationUrl("http://docu.url.com");
        Statistics statistics = new Statistics();
        statistics.setAverageLatency((long) 230);
        statistics.setImports((long) 1000);
        statistics.setSuccessRate(99.7);
        provider.setStatistics(statistics);
        provider.setCredentialSteps("Credential steps here");
        List<Provider> providers = new ArrayList<>();
        providers.add(provider);
        providers.add(provider);
        return Mono.just(providers)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
