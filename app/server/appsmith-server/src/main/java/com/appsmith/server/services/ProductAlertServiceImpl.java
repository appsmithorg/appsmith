package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.services.ce.ProductAlertServiceCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ProductAlertServiceImpl extends ProductAlertServiceCEImpl implements ProductAlertService {

    public ProductAlertServiceImpl(ObjectMapper objectMapper, CommonConfig commonConfig) {
        super(objectMapper, commonConfig);
    }
}
