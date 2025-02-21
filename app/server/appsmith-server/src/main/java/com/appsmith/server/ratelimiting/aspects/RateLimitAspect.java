package com.appsmith.server.ratelimiting.aspects;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.ratelimiting.annotations.RateLimit;
import com.appsmith.server.services.SessionUserService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Aspect
@Component
public class RateLimitAspect {
    private final RateLimitService rateLimitService;
    private final SessionUserService sessionUserService;

    public RateLimitAspect(RateLimitService rateLimitService, SessionUserService sessionUserService) {
        this.rateLimitService = rateLimitService;
        this.sessionUserService = sessionUserService;
    }

    @Around(value = "@annotation(rateLimit)")
    public Object applyRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        String apiIdentifier = rateLimit.api();
        Mono<User> loggedInUser = sessionUserService.getCurrentUser();
        Mono<String> userIdentifier = loggedInUser.map(User::getEmail);

        return userIdentifier.flatMap(email -> {
            Mono<Boolean> isAllowedMono = rateLimitService.tryIncreaseCounter(apiIdentifier, email);
            return isAllowedMono.flatMap(isAllowed -> {
                if (!isAllowed) {
                    AppsmithException exception = new AppsmithException(AppsmithError.TOO_MANY_REQUESTS);
                    return Mono.just(
                            new ResponseDTO<>(HttpStatus.resolve(exception.getHttpStatus()), exception.getMessage()));
                }

                try {
                    Object result = joinPoint.proceed();
                    return result instanceof Mono ? (Mono) result : Mono.just(result);
                } catch (Throwable e) {
                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                }
            });
        });
    }
}
