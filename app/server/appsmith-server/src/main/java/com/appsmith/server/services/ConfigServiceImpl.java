package com.appsmith.server.services;

import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.services.ce.ConfigServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ConfigServiceImpl extends ConfigServiceCEImpl implements ConfigService {

    public ConfigServiceImpl(ConfigRepository repository,
                             ApplicationRepository applicationRepository,
                             DatasourceRepository datasourceRepository) {

        super(repository, applicationRepository, datasourceRepository);
    }
}
