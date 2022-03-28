package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Provider;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ProviderPaginatedDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.SearchResponseDTO;
import com.appsmith.server.services.MarketplaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import java.util.List;


@RequestMapping(Url.MARKETPLACE_URL)
@Slf4j
public class MarketplaceControllerCE {
    private final MarketplaceService marketplaceService;

    public MarketplaceControllerCE(ObjectMapper objectMapper,
                                   MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/search")
    Mono<ResponseDTO<SearchResponseDTO>> searchAPIOrProviders(@RequestParam String searchKey, @RequestParam(required = false) Integer limit) {

        return marketplaceService.searchProviderByName(searchKey)
                .map(result -> {
                    SearchResponseDTO searchResponseDTO = new SearchResponseDTO();
                    searchResponseDTO.setProviders(result);
                    return new ResponseDTO<>(HttpStatus.OK.value(), searchResponseDTO, null);
                });
    }

    @GetMapping("/templates")
    public Mono<ResponseDTO<List<ApiTemplate>>> getAllTemplatesFromMarketplace(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all templates from Marketplace");
        return marketplaceService.getTemplates(params)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/providers")
    public Mono<ResponseDTO<ProviderPaginatedDTO>> getAllProvidersFromMarketplace(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all providers from Marketplace");
        return marketplaceService.getProviders(params)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/providers/{id}")
    public Mono<ResponseDTO<Provider>> getProviderByIdFromMarketplace(@PathVariable String id) {
        log.debug("Going to get provider from Marketplace with id {}", id);
        return marketplaceService.getProviderById(id)
                .map(resource -> new ResponseDTO<>(HttpStatus.OK.value(), resource, null));
    }

    @GetMapping("/categories")
    public Mono<ResponseDTO<List<String>>> getAllCategoriesFromMarketplace() {
        log.debug("Going to get all categories from Marketplace");
        return marketplaceService.getCategories()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

}
