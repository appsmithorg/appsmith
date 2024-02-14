package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ce.CurlImporterServiceCEImpl;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import static com.appsmith.server.helpers.ContextTypeUtils.isWorkflowContext;

@Slf4j
@Service
public class CurlImporterServiceImpl extends CurlImporterServiceCEImpl implements CurlImporterService {

    public CurlImporterServiceImpl(
            PluginService pluginService,
            LayoutActionService layoutActionService,
            NewPageService newPageService,
            ResponseUtils responseUtils,
            ObjectMapper objectMapper,
            PagePermission pagePermission) {
        super(pluginService, layoutActionService, newPageService, responseUtils, objectMapper, pagePermission);
    }

    @Override
    protected Mono<String> getBranchedContextId(CreatorContextType contextType, String contextId, String branchName) {
        if (isWorkflowContext(contextType)) {
            // TODO: Fetch workflow Id for a branch name, once git is introduced to Workflows
            return Mono.just(contextId);
        }
        return super.getBranchedContextId(contextType, contextId, branchName);
    }

    @Override
    protected Mono<ActionDTO> associateContextIdToActionDTO(
            ActionDTO actionDTO, CreatorContextType contextType, String contextId) {
        if (isWorkflowContext(contextType)) {
            actionDTO.setWorkflowId(contextId);
            actionDTO.setContextType(contextType);
            return Mono.just(actionDTO);
        }
        return super.associateContextIdToActionDTO(actionDTO, contextType, contextId);
    }
}
