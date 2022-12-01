package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.LogoutSuccessHandlerCE;
import com.appsmith.server.services.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LogoutSuccessHandler extends LogoutSuccessHandlerCE {

    public LogoutSuccessHandler(ObjectMapper objectMapper, AnalyticsService analyticsService) {
        super(objectMapper, analyticsService);
    }

}
