package com.appsmith.server.services;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Documentation;
import com.appsmith.server.dtos.AddItemToPageDTO;
import com.appsmith.server.dtos.ItemDTO;
import com.appsmith.server.dtos.ItemType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class ItemServiceImpl implements ItemService {
    private final ApiTemplateService apiTemplateService;
    private final ActionService actionService;
    private final PluginService pluginService;
    private static final String RAPID_API_PLUGIN = "rapidapi-plugin";

    public ItemServiceImpl(ApiTemplateService apiTemplateService,
                           ActionService actionService, PluginService pluginService) {
        this.apiTemplateService = apiTemplateService;
        this.actionService = actionService;
        this.pluginService = pluginService;
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
    public Mono<Action> addItemToPage(AddItemToPageDTO addItemToPageDTO) {
        if (!addItemToPageDTO.getMarketplaceElement().getType().equals(ItemType.TEMPLATE)) {
            log.debug("Only templates can currently be added to the page. Any other type is unsupported.");
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }

        ApiTemplate apiTemplate = addItemToPageDTO.getMarketplaceElement().getItem();

        Action action = new Action();
        action.setName(addItemToPageDTO.getName());
        action.setPageId(addItemToPageDTO.getPageId());
        action.setTemplateId(apiTemplate.getId());
        action.setProviderId(apiTemplate.getProviderId());

        Documentation documentation = new Documentation();
        documentation.setText(apiTemplate.getApiTemplateConfiguration().getDocumentation());
        documentation.setUrl(apiTemplate.getApiTemplateConfiguration().getDocumentationUrl());
        action.setDocumentation(documentation);
        /** TODO
         * Also hit the Marketplace to update the number of imports.
         */

        // Set Action Fields
        action.setActionConfiguration(apiTemplate.getActionConfiguration());
        if (apiTemplate.getApiTemplateConfiguration().getSampleResponse() != null &&
                apiTemplate.getApiTemplateConfiguration().getSampleResponse().getBody() != null ) {
            action.setCacheResponse(apiTemplate.getApiTemplateConfiguration().getSampleResponse().getBody().toString());
        }

        return pluginService
                // Assume that we are only adding rapid api templates right now. Set the package to rapid-api forcibly
                /** TODO
                 * Scraper should set the correct package name (rapidapi-plugin) instead of restapi-plugin
                 */
                .findByPackageName(RAPID_API_PLUGIN)
                .map(plugin -> {
                    //Set Datasource
                    Datasource datasource = new Datasource();
                    datasource.setDatasourceConfiguration(apiTemplate.getDatasourceConfiguration());
                    datasource.setName(apiTemplate.getDatasourceConfiguration().getUrl());
                    datasource.setPluginId(plugin.getId());
                    action.setDatasource(datasource);
                    action.setPluginType(plugin.getType());
                    return action;
                })
                .flatMap(actionService::create);
    }
}
