package com.appsmith.server.services.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Provider;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.dtos.ProviderPaginatedDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.MarketplaceService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class MarketplaceServiceCEImpl implements MarketplaceServiceCE {
    private final WebClient webClient;

    private final CloudServicesConfig cloudServicesConfig;

    private static String PROVIDER_PATH = "/providers";

    private static String TEMPLATE_PATH = "/templates";

    private static String CATEGORIES_PATH = PROVIDER_PATH + "/categories";

    private static String USE_PROVIDER_API = PROVIDER_PATH + "/use";

    private final ObjectMapper objectMapper;

    private final Long timeoutInMillis = Long.valueOf(10000);

    @Autowired
    public MarketplaceServiceCEImpl(WebClient.Builder webClientBuilder,
                                    CloudServicesConfig cloudServicesConfig, ObjectMapper objectMapper) {
        this.cloudServicesConfig = cloudServicesConfig;
        this.webClient = webClientBuilder
                .defaultHeaders(header -> header.setBasicAuth(cloudServicesConfig.getUsername(),
                        cloudServicesConfig.getPassword()))
                .baseUrl(cloudServicesConfig.getBaseUrl())
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<ProviderPaginatedDTO> getProviders(MultiValueMap<String, String> params) {
        URI uri = buildFullURI(params, PROVIDER_PATH);

        if (uri == null) {
            return Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_NOT_CONFIGURED));
        }

        return webClient
                .get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(stringBody -> {
                    ProviderPaginatedDTO providersPaginated = null;
                    try {
                        providersPaginated = objectMapper.readValue(stringBody, ProviderPaginatedDTO.class);
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
                    }
                    return Mono.just(providersPaginated);
                })
                .timeout(Duration.ofMillis(timeoutInMillis))
                .doOnError(error -> Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_TIMEOUT)));
    }

    @Override
    public Mono<List<ApiTemplate>> getTemplates(MultiValueMap<String, String> params) {
        URI uri = buildFullURI(params, TEMPLATE_PATH);

        if (uri == null) {
            return Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_NOT_CONFIGURED));
        }

        return webClient
                .get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(stringBody -> {
                    List<ApiTemplate> templates = null;
                    try {
                        templates = objectMapper.readValue(stringBody, ArrayList.class);
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
                    }
                    return Mono.just(templates);
                })
                .timeout(Duration.ofMillis(timeoutInMillis))
                .doOnError(error -> Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_TIMEOUT)));
    }

    @Override
    public Mono<List<String>> getCategories() {
        URI uri = buildFullURI(null, CATEGORIES_PATH);

        if (uri == null) {
            return Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_NOT_CONFIGURED));
        }

        return webClient
                .get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(stringBody -> {
                    List<String> categories = null;
                    try {
                        categories = objectMapper.readValue(stringBody, ArrayList.class);
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
                    }
                    return Mono.just(categories);
                })
                .timeout(Duration.ofMillis(timeoutInMillis))
                .doOnError(error -> Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_TIMEOUT)));
    }

    @Override
    public Mono<Boolean> subscribeAndUpdateStatisticsOfProvider(String providerId) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("id", providerId);
        URI uri = buildFullURI(params, USE_PROVIDER_API);

        if (uri == null) {
            return Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_NOT_CONFIGURED));
        }

        return webClient
                .put()
                .uri(uri)
                .retrieve()
                .bodyToMono(Boolean.class);
    }

    @Override
    public Mono<Provider> getProviderById(String id) {
        URI uri = buildFullURI(null, PROVIDER_PATH + "/" + id);

        if (uri == null) {
            return Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_NOT_CONFIGURED));
        }

        return webClient
                .get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(stringBody -> {
                    Provider provider = null;
                    try {
                        provider = objectMapper.readValue(stringBody, Provider.class);
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
                    }
                    return Mono.just(provider);
                })
                .timeout(Duration.ofMillis(timeoutInMillis))
                .doOnError(error -> Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_TIMEOUT)));
    }

    @Override
    /**
     * This function searches for providers and returns the providers with exact match in name.
     * In the future the search should support 'like' for providers and search could expand to include
     * the actions used in the organization (across all applications) and templates as well.
     */
    public Mono<List<Provider>> searchProviderByName(String name) {
        URI uri = buildFullURI(null, PROVIDER_PATH + "/name/" + URLEncoder.encode(name, StandardCharsets.UTF_8));

        if (uri == null) {
            return Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_NOT_CONFIGURED));
        }

        return webClient
                .get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(stringBody -> {
                    List<Provider> providers = null;
                    try {
                        providers = objectMapper.readValue(stringBody, ArrayList.class);
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
                    }
                    return Mono.just(providers);
                })
                .timeout(Duration.ofMillis(timeoutInMillis))
                .doOnError(error -> Mono.error(new AppsmithException(AppsmithError.MARKETPLACE_TIMEOUT)));
    }

    private URI buildFullURI(MultiValueMap<String, String> params, String path) {
        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (!StringUtils.hasText(baseUrl)) {
            return null;
        }

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(baseUrl + path));
        } catch (URISyntaxException e) {
            log.error(e.getMessage());
            return null;
        }

        if (params != null) {
            for (String key : params.keySet()) {
                uriBuilder.queryParam(key, URLEncoder.encode(params.getFirst(key), StandardCharsets.UTF_8));
            }
        }

        return uriBuilder.build(true).toUri();
    }
}
