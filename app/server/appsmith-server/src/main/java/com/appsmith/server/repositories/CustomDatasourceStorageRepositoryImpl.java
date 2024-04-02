package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceStorageRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomDatasourceStorageRepositoryImpl extends CustomDatasourceStorageRepositoryCEImpl
        implements CustomDatasourceStorageRepository {}
