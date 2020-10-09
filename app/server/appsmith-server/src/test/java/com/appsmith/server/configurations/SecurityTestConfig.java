package com.appsmith.server.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityTestConfig {

    @Bean
    public SecurityWebFilterChain testSecurityWebFilterChain(ServerHttpSecurity http){
        return http.csrf().disable().build();
    }
}
