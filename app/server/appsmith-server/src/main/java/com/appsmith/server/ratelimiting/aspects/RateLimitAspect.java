package com.appsmith.server.ratelimiting.aspects;

import com.appsmith.server.constants.ApiConstants;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.ratelimiting.annotations.RateLimit;
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

    public RateLimitAspect(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Around(value = "@annotation(rateLimit)")
    public Object applyRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        String apiIdentifier = rateLimit.api();
        String userIdentifier = rateLimit.userIdentifier();

        Mono<Boolean> isAllowedMono = rateLimitService.tryIncreaseCounter(apiIdentifier, userIdentifier);
        return isAllowedMono.flatMap(isAllowed -> {
            if (!isAllowed) {
                return Mono.just(new ResponseDTO<>(
                        HttpStatus.TOO_MANY_REQUESTS.value(), ApiConstants.RATE_LIMIT_EXCEEDED_ERROR, null));
            }

            try {
                Object result = joinPoint.proceed();
                if (isSuccessfulResponse(result)) {
                    rateLimitService.resetCounter(apiIdentifier, userIdentifier);
                }
                return Mono.just(result);
            } catch (Throwable e) {
                AppsmithError error = AppsmithError.INTERNAL_SERVER_ERROR;
                throw new AppsmithException(error, e.getMessage());
            }
        });
    }

    private boolean isSuccessfulResponse(Object result) {
        return result instanceof ResponseDTO
                && ((ResponseDTO<?>) result).getResponseMeta().getStatus() >= 200
                && ((ResponseDTO<?>) result).getResponseMeta().getStatus() < 300;
    }
}
