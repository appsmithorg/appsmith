package com.appsmith.server.controllers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.ApiTemplateConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.Provider;
import com.appsmith.external.models.Statistics;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.ProviderPaginatedDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.SearchResponseDTO;
import com.appsmith.server.services.MarketplaceService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(Url.MARKETPLACE_URL)
@Slf4j
public class MarketplaceController {
    private final ObjectMapper objectMapper;
    private final MarketplaceService marketplaceService;

    public MarketplaceController(ObjectMapper objectMapper,
                                 MarketplaceService marketplaceService) {
        this.objectMapper = objectMapper;
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/search")
    Mono<ResponseDTO<SearchResponseDTO>> searchAPIOrProviders(@RequestParam String searchKey, @RequestParam(required = false) Integer limit) {
        SearchResponseDTO searchResponseDTO = new SearchResponseDTO();
        List<Provider> providers = new ArrayList<>();
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

        providers.add(provider);
        searchResponseDTO.setProviders(providers);

        List<ApiTemplate> apiTemplates = new ArrayList<>();
        ApiTemplate apiTemplate = new ApiTemplate();
        apiTemplate.setId("Id");
        apiTemplate.setPackageName("restapi-plugin");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://google.com");
        apiTemplate.setDatasourceConfiguration(datasourceConfiguration);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("/viewSomething");
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        List<Property> headers = new ArrayList<>();
        Property header = new Property();
        header.setKey("key");
        header.setValue("value");
        headers.add(header);
        actionConfiguration.setHeaders(headers);
        apiTemplate.setActionConfiguration(actionConfiguration);

        ApiTemplateConfiguration apiTemplateConfiguration = new ApiTemplateConfiguration();
        apiTemplateConfiguration.setDocumentation("documentation");
        apiTemplateConfiguration.setDocumentationUrl("http://url.com");
        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setBody("body");
        actionExecutionResult.setStatusCode("200");
        String headersInString = "{\\r\\n            \\\"Date\\\": [\\r\\n                \\\"Thu, 06 Feb 2020 13:09:27 GMT\\\"\\r\\n            ],\\r\\n            \\\"Content-Type\\\": [\\r\\n                \\\"application\\/json; charset=utf-8\\\"\\r\\n            ],\\r\\n            \\\"Connection\\\": [\\r\\n                \\\"keep-alive\\\"\\r\\n            ],\\r\\n            \\\"Set-Cookie\\\": [\\r\\n                \\\"__cfduid=dcdfc69e4b24eed1dbde13490b60fa2931580994567; expires=Sat, 07-Mar-20 13:09:27 GMT; path=\\/; domain=.pokeapi.co; HttpOnly; SameSite=Lax; Secure\\\"\\r\\n            ],\\r\\n            \\\"access-control-allow-origin\\\": [\\r\\n                \\\"*\\\"\\r\\n            ],\\r\\n            \\\"cache-control\\\": [\\r\\n                \\\"public, max-age=86400, s-maxage=86400\\\"\\r\\n            ],\\r\\n            \\\"etag\\\": [\\r\\n                \\\"W\\/\\\\\\\"5bc-hMqibo\\/v586SwY5Pw+N9QHVbp1M\\\\\\\"\\\"\\r\\n            ],\\r\\n            \\\"function-execution-id\\\": [\\r\\n                \\\"aclq7ln3lowb\\\"\\r\\n            ],\\r\\n            \\\"x-powered-by\\\": [\\r\\n                \\\"Express\\\"\\r\\n            ],\\r\\n            \\\"x-cloud-trace-context\\\": [\\r\\n                \\\"f838c06278fff2cc715ed3f4cc8c27f6\\\"\\r\\n            ],\\r\\n            \\\"X-Served-By\\\": [\\r\\n                \\\"cache-sin18040-SIN\\\"\\r\\n            ],\\r\\n            \\\"X-Cache\\\": [\\r\\n                \\\"HIT\\\"\\r\\n            ],\\r\\n            \\\"X-Cache-Hits\\\": [\\r\\n                \\\"1\\\"\\r\\n            ],\\r\\n            \\\"X-Timer\\\": [\\r\\n                \\\"S1564191065.116552,VS0,VE1\\\"\\r\\n            ],\\r\\n            \\\"Vary\\\": [\\r\\n                \\\"accept-encoding, x-fh-requested-host, cookie, authorization\\\"\\r\\n            ],\\r\\n            \\\"CF-Cache-Status\\\": [\\r\\n                \\\"REVALIDATED\\\"\\r\\n            ],\\r\\n            \\\"Accept-Ranges\\\": [\\r\\n                \\\"bytes\\\"\\r\\n            ],\\r\\n            \\\"Expect-CT\\\": [\\r\\n                \\\"max-age=604800, report-uri=\\\\\\\"https:\\/\\/report-uri.cloudflare.com\\/cdn-cgi\\/beacon\\/expect-ct\\\\\\\"\\\"\\r\\n            ],\\r\\n            \\\"Server\\\": [\\r\\n                \\\"cloudflare\\\"\\r\\n            ],\\r\\n            \\\"CF-RAY\\\": [\\r\\n                \\\"560d5bce6a17d9e0-SIN\\\"\\r\\n            ],\\r\\n            \\\"transfer-encoding\\\": [\\r\\n                \\\"chunked\\\"\\r\\n            ]\\r\\n        }";
        try {
            JsonNode headersNode = objectMapper.readTree(headersInString);
            actionExecutionResult.setHeaders(headersNode);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        apiTemplateConfiguration.setSampleResponse(actionExecutionResult);
        apiTemplate.setApiTemplateConfiguration(apiTemplateConfiguration);
        apiTemplates.add(apiTemplate);
        searchResponseDTO.setApiTemplates(apiTemplates);

        List<Action> actions = new ArrayList<>();
        Action action = new Action();
        action.setName("ResultActionAPI");
        Datasource datasource = new Datasource();
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);
        actions.add(action);
        searchResponseDTO.setActions(actions);

        return Mono.just(searchResponseDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));

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

    @GetMapping("/categories")
    public Mono<ResponseDTO<List<String>>> getAllCategoriesFromMarketplace() {
        log.debug("Going to get all categories from Marketplace");
        return marketplaceService.getCategories()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

}
