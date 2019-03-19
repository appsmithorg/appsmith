package com.mobtools.server.configurations;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

//    private final DaoAuthenticationManager reactiveAuthenticationManager;

//    private final SecurityContextRepository securityContextRepository;

//    @Autowired
//    public SecurityConfig(DaoAuthenticationManager reactiveAuthenticationManager,
//                          SecurityContextRepository securityContextRepository) {
//        this.reactiveAuthenticationManager = reactiveAuthenticationManager;
//        this.securityContextRepository = securityContextRepository;
//    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf().disable()
                .formLogin().disable()
                .httpBasic().disable()
//            .authenticationManager(reactiveAuthenticationManager)
//            .securityContextRepository(securityContextRepository)
                .authorizeExchange()
                .anyExchange().permitAll()
                .and()
                .logout().disable()
                .build();
    }
}
