package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.services.ce.AssetServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class AssetServiceImpl extends AssetServiceCEImpl implements AssetService {
    private final AssetRepository repository;

    public AssetServiceImpl(AssetRepository repository, AnalyticsService analyticsService) {
        super(repository, analyticsService);
        this.repository = repository;
    }

    @Override
    public Mono<Asset> findByName(String name) {
        return repository.findByName(name);
    }
}
