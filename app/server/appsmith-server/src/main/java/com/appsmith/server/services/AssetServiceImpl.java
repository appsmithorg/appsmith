package com.appsmith.server.services;

import com.appsmith.server.repositories.cakes.AssetRepositoryCake;
import com.appsmith.server.services.ce.AssetServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AssetServiceImpl extends AssetServiceCEImpl implements AssetService {

    public AssetServiceImpl(AssetRepositoryCake repository, AnalyticsService analyticsService) {

        super(repository, analyticsService);
    }
}
