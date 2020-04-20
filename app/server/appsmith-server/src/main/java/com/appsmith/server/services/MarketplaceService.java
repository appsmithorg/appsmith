package com.appsmith.server.services;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Provider;
import com.appsmith.server.dtos.ProviderPaginatedDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;

public interface MarketplaceService {
    Mono<ProviderPaginatedDTO> getProviders(MultiValueMap<String, String> params);

    Mono<List<ApiTemplate>> getTemplates(MultiValueMap<String, String> params);

    Mono<List<String>> getCategories();

    Mono<Boolean> subscribeAndUpdateStatisticsOfProvider(String providerId);

    Mono<Provider> getProviderById(String id);
}
