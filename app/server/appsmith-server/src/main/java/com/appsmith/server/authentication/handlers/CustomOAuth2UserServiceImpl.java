package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomOAuth2UserServiceCEImpl;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.ReactiveOAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CustomOAuth2UserServiceImpl extends CustomOAuth2UserServiceCEImpl
        implements ReactiveOAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private UserRepository repository;
    private UserService userService;

    @Autowired
    public CustomOAuth2UserServiceImpl(UserRepository repository, UserService userService) {
        super(repository, userService);
        this.repository = repository;
        this.userService = userService;
    }
}
