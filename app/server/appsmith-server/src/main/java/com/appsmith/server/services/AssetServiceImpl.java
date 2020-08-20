package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.repositories.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private final AssetRepository repository;

    @Override
    public Mono<Asset> getById(String id) {
        return repository.findById(id);
    }

}
