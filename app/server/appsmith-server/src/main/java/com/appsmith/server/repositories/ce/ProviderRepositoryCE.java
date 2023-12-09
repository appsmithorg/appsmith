package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Provider;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomProviderRepository;

import java.util.List;

public interface ProviderRepositoryCE extends BaseRepository<Provider, String>, CustomProviderRepository {
    List<Provider> findByName(String name);
}
