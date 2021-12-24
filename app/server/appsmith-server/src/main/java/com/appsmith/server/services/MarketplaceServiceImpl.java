package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.services.ce.MarketplaceServiceCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
public class MarketplaceServiceImpl extends MarketplaceServiceCEImpl implements MarketplaceService {

    public MarketplaceServiceImpl(WebClient.Builder webClientBuilder,
                                  CloudServicesConfig cloudServicesConfig,
                                  ObjectMapper objectMapper) {

        super(webClientBuilder, cloudServicesConfig, objectMapper);
    }
}
