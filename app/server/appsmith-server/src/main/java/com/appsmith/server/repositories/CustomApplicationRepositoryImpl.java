package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomApplicationRepositoryCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomApplicationRepositoryImpl extends CustomApplicationRepositoryCEImpl
        implements CustomApplicationRepository {

    @Autowired
    public CustomApplicationRepositoryImpl(
            CacheableRepositoryHelper cacheableRepositoryHelper, ApplicationPermission applicationPermission) {
        super(cacheableRepositoryHelper, applicationPermission);
    }
}
