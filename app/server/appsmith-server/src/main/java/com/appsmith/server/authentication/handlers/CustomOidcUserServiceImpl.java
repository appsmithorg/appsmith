package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomOidcUserServiceCEImpl;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.ReactiveOAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CustomOidcUserServiceImpl extends CustomOidcUserServiceCEImpl
        implements ReactiveOAuth2UserService<OidcUserRequest, OidcUser> {

    private UserRepository repository;
    private UserService userService;

    @Autowired
    public CustomOidcUserServiceImpl(UserRepository repository, UserService userService) {
        super(repository, userService);
        this.repository = repository;
        this.userService = userService;
    }
}
