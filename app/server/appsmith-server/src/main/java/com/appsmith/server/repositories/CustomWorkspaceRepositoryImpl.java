package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomWorkspaceRepositoryCEImpl;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomWorkspaceRepositoryImpl extends CustomWorkspaceRepositoryCEImpl
        implements CustomWorkspaceRepository {

    public CustomWorkspaceRepositoryImpl(SessionUserService sessionUserService) {
        super(sessionUserService);
    }
}
