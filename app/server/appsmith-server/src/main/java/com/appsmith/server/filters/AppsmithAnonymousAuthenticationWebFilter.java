package com.appsmith.server.filters;

import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.server.authentication.AnonymousAuthenticationWebFilter;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.UserService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
public class AppsmithAnonymousAuthenticationWebFilter extends AnonymousAuthenticationWebFilter {

    private UserService userService;
    private User anonymousUser;
    private String key;

    private List<GrantedAuthority> authorities = AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS");

    public AppsmithAnonymousAuthenticationWebFilter(String key, UserService userService) {
        super(key);
        this.key = key;
        this.userService = userService;
    }

    private Mono<User> getAnonymousUser() {
        if(anonymousUser != null) {
            return Mono.just(anonymousUser);
        }
        return userService.findByEmail(FieldName.ANONYMOUS_USER)
                .doOnNext(user -> anonymousUser = user);
    }

    private Mono<Authentication> createAuthenticationMono(ServerWebExchange exchange) {
        //TODO: figure out tenant and return its anonymousUser
        return getAnonymousUser()
                .map(user ->  new AnonymousAuthenticationToken(this.key, user, this.authorities));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
		return ReactiveSecurityContextHolder.getContext().switchIfEmpty(Mono.defer(() -> {
            return createAuthenticationMono(exchange)
                    .flatMap(authentication -> {
                        SecurityContext securityContext = new SecurityContextImpl(authentication);
                        log.debug("Populated SecurityContext with anonymous token: '{}'", authentication);
                        return chain.filter(exchange)
                                .contextWrite(ReactiveSecurityContextHolder.withSecurityContext(Mono.just(securityContext)))
                                .then(Mono.empty());
                    });
		})).flatMap((securityContext) -> {
            log.debug("SecurityContext contains anonymous token: '{}'", securityContext.getAuthentication());
			return chain.filter(exchange);
		});
	}
    
}
