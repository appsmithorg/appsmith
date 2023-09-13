package com.appsmith.server.onpageload.internal;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.onpageload.executables.ExecutableOnPageLoadService;
import com.appsmith.server.services.AstService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PageLoadExecutablesUtilImpl extends PageLoadExecutablesUtilCEImpl implements PageLoadExecutablesUtil {

    public PageLoadExecutablesUtilImpl(
            AstService astService,
            ObjectMapper objectMapper,
            ExecutableOnPageLoadService<ActionDTO> actionExecutableOnPageLoadService) {
        super(astService, objectMapper, actionExecutableOnPageLoadService);
    }
}
