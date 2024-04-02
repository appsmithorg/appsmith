package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomDatasourceRepositoryImpl extends CustomDatasourceRepositoryCEImpl
        implements CustomDatasourceRepository {}
