package com.appsmith.server.onload.internal;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.services.AstService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OnLoadExecutablesUtilImpl extends OnLoadExecutablesUtilCEImpl implements OnLoadExecutablesUtil {

    public OnLoadExecutablesUtilImpl(
            AstService astService,
            ObjectMapper objectMapper,
            ExecutableOnLoadService<NewPage> pageExecutableOnLoadService,
            ObservationRegistry observationRegistry) {
        super(astService, objectMapper, pageExecutableOnLoadService, observationRegistry);
    }
}
