package com.appsmith.server.git;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.LayoutActionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class GitArtifactTestUtils<T extends Artifact> {

    @Autowired
    LayoutActionService layoutActionService;
    @Autowired
    PluginService pluginService;

    Mono<Void> createADiff(Artifact artifact) {

        Application application = (Application) artifact;

        String pageId = application.getPages().get(0).getId();
        Plugin plugin = pluginService.findByPackageName("restapi-plugin").block();

        Datasource datasource = new Datasource();
        datasource.setName(PluginConstants.DEFAULT_REST_DATASOURCE);
        datasource.setWorkspaceId(application.getWorkspaceId());
        datasource.setPluginId(plugin.getId());

        ActionDTO action = new ActionDTO();
        action.setPluginType(PluginType.API);
        action.setName("aGetAction_" + UUID.randomUUID());
        action.setDatasource(datasource);
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(pageId);

        return layoutActionService
            .createSingleAction(action, Boolean.FALSE)
            .then();
    }
}
