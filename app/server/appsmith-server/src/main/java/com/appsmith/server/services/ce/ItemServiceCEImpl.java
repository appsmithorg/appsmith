package com.appsmith.server.services.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Documentation;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.AddItemToPageDTO;
import com.appsmith.server.dtos.ItemDTO;
import com.appsmith.server.dtos.ItemType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApiTemplateService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.MarketplaceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.PluginService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


@Slf4j
public class ItemServiceCEImpl implements ItemServiceCE {

    private final ApiTemplateService apiTemplateService;
    private final PluginService pluginService;
    private final MarketplaceService marketplaceService;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;
    private static final String RAPID_API_PLUGIN = "rapidapi-plugin";

    public ItemServiceCEImpl(ApiTemplateService apiTemplateService,
                             PluginService pluginService,
                             MarketplaceService marketplaceService,
                             NewActionService newActionService,
                             LayoutActionService layoutActionService) {
        this.apiTemplateService = apiTemplateService;
        this.pluginService = pluginService;
        this.marketplaceService = marketplaceService;
        this.newActionService = newActionService;
        this.layoutActionService = layoutActionService;
    }

    @Override
    public Flux<ItemDTO> get(MultiValueMap<String, String> params) {

        if ((params.getFirst(FieldName.APPLICATION_ID) != null) && (params.getFirst(FieldName.PROVIDER_ID) != null)) {
            // Both application id is set and provider id is set. This implies that we are fetching items from both
            // templates and actions. That is not supported. Error out here.
            return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        } else if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        } else if (params.getFirst(FieldName.PROVIDER_ID) != null) {
            return apiTemplateService
                    .get(params)
                    .map(apiTemplate -> {
                        ItemDTO itemDTO = new ItemDTO();
                        itemDTO.setItem(apiTemplate);
                        itemDTO.setType(ItemType.TEMPLATE);

                        return itemDTO;
                    });
        }

        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ActionDTO> addItemToPage(AddItemToPageDTO addItemToPageDTO) {
        if (!addItemToPageDTO.getMarketplaceElement().getType().equals(ItemType.TEMPLATE)) {
            log.debug("Only templates can currently be added to the page. Any other type is unsupported.");
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }

        if (addItemToPageDTO.getOrganizationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        ApiTemplate apiTemplate = addItemToPageDTO.getMarketplaceElement().getItem();

        ActionDTO action = new ActionDTO();
        action.setName(addItemToPageDTO.getName());
        action.setPageId(addItemToPageDTO.getPageId());
        action.setTemplateId(apiTemplate.getId());
        action.setProviderId(apiTemplate.getProviderId());

        Documentation documentation = new Documentation();
        documentation.setText(apiTemplate.getApiTemplateConfiguration().getDocumentation());
        documentation.setUrl(apiTemplate.getApiTemplateConfiguration().getDocumentationUrl());
        action.setDocumentation(documentation);

        // Set Action Fields
        action.setActionConfiguration(apiTemplate.getActionConfiguration());
        if (apiTemplate.getApiTemplateConfiguration().getSampleResponse() != null &&
                apiTemplate.getApiTemplateConfiguration().getSampleResponse().getBody() != null) {
            action.setCacheResponse(apiTemplate.getApiTemplateConfiguration().getSampleResponse().getBody().toString());
        }

        log.debug("Going to subscribe marketplace provider : {} and then create action", apiTemplate.getProviderId());
        return marketplaceService
                // First hit the marketplace to update the statistics and to subscribe to the provider in case it hasn't
                .subscribeAndUpdateStatisticsOfProvider(apiTemplate.getProviderId())

                // Assume that we are only adding rapid api templates right now. Set the package to rapid-api forcibly
                .then(pluginService.findByPackageName(RAPID_API_PLUGIN))
                .map(plugin -> {
                    //Set Datasource
                    Datasource datasource = new Datasource();
                    datasource.setDatasourceConfiguration(apiTemplate.getDatasourceConfiguration());
                    datasource.setName(apiTemplate.getDatasourceConfiguration().getUrl());
                    datasource.setPluginId(plugin.getId());
                    datasource.setOrganizationId(addItemToPageDTO.getOrganizationId());
                    action.setDatasource(datasource);
                    action.setPluginType(plugin.getType());
                    return action;
                })
                .flatMap(layoutActionService::createSingleAction);
    }
}
