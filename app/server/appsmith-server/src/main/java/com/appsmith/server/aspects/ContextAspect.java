package com.appsmith.server.aspects;

import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Aspect
@Component
@Slf4j
public class ContextAspect {

//    @Around("execution(reactor.core.publisher.Mono+ com.appsmith.server.services.CrudService+")
    @Around("execution(reactor.core.publisher.Mono+ com.appsmith.server.services.CrudService.*(..))")
    public Mono<?> addAuthorization(ProceedingJoinPoint joinPoint) {
        try {
            log.debug("In the custom aspect");
            return ReactiveSecurityContextHolder.getContext()
                    .map(ctx -> ctx.getAuthentication())
                    .map(auth -> auth.getPrincipal())
                    .map(principal -> {
                        User user = (User) principal;
                        log.debug("{}", user.getAuthorities());
                        if(user.getAuthorities().contains(new SimpleGrantedAuthority("read:applications"))) {
                            log.debug("Got the permission");
                        }
                        return principal;
                    })
                    .then((Mono<?>) joinPoint.proceed());
//            return Mono.just(true);
//            return ((Mono<?>) joinPoint.proceed());
//                    .subscriberContext(Context.of(UserRepository.CONTEXT_CLIENT_KEY, getClient()));
        } catch (Throwable throwable) {
            return Mono.error(throwable);
        }
    }
}
