package com.appsmith.server.aspect;

import com.appsmith.server.acl.AclPermission;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;

import static com.appsmith.server.helpers.UserPermissionUtils.updateAclWithUserContext;

@Aspect
@Slf4j
@Component
public class PermissionAspect {

    @Around("execution(* com.appsmith.server.repositories..*(..))")
    public Object handlePermission(ProceedingJoinPoint joinPoint) throws Throwable {

        AclPermission permissionWithoutUserContext = Arrays.stream(joinPoint.getArgs())
                .filter(arg -> arg instanceof AclPermission)
                .map(arg -> (AclPermission) arg)
                // We expect only one permission object to be passed to the repository methods.
                .findFirst()
                .orElse(null);
        if (permissionWithoutUserContext == null) {
            return joinPoint.proceed(joinPoint.getArgs());
        }

        Mono<AclPermission> permissionMono = updateAclWithUserContext(permissionWithoutUserContext);
        Class<?> returnType =
                ((MethodSignature) joinPoint.getSignature()).getMethod().getReturnType();
        if (Mono.class.isAssignableFrom(returnType)) {
            return permissionMono.then(Mono.defer(() -> {
                try {
                    return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                } catch (Throwable e) {
                    log.error(
                            "Error occurred while adding the user context to the permission object when invoking function {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Mono.error(e);
                }
            }));
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return permissionMono.thenMany(Flux.defer(() -> {
                try {
                    return (Flux<?>) joinPoint.proceed(joinPoint.getArgs());
                } catch (Throwable e) {
                    log.error(
                            "Error occurred while adding the user context to the permission object when invoking function {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Flux.error(e);
                }
            }));
        }
        return joinPoint.proceed(joinPoint.getArgs());
    }
}
