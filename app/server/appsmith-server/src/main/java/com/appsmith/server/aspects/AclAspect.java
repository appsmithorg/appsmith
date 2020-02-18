package com.appsmith.server.aspects;

import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AclEntity;
import com.appsmith.server.services.AclPermission;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Set;

@Aspect
@Component
@Slf4j
public class AclAspect {

    @Around("execution(reactor.core.publisher.Mono+ com.appsmith.server.services.CrudService.*(..))")
    public Mono<?> checkAuthorization(ProceedingJoinPoint joinPoint) {
        try {
            return ReactiveSecurityContextHolder.getContext()
                    .map(ctx -> ctx.getAuthentication())
                    .map(auth -> auth.getPrincipal())
                    .filter(principal -> {
                        User user = (User) principal;

                        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                        Method method = signature.getMethod();
                        log.debug("Checking the authorization for user: {} for function: {}", user.getEmail(), method.getName());

                        // Get the auth permission to be applied
                        AclPermission aclPermissionAnnotation = AnnotationUtils.findAnnotation(method, AclPermission.class);
                        if (aclPermissionAnnotation == null) {
                            // There are no permission annotations on the method. Continue
                            return true;
                        }
                        String[] authPermission = aclPermissionAnnotation.values();

                        // Get the entity on which permission needs to be applied
                        String authEntity = joinPoint.getTarget().getClass().getAnnotation(AclEntity.class).value();

                        Set<GrantedAuthority> actualPermissions = new HashSet<>();
                        if (authPermission != null && authPermission.length > 0) {
                            for (int i = 0; i < authPermission.length; i++) {
                                actualPermissions.add(new SimpleGrantedAuthority(authPermission[i] + ":" + authEntity));
                            }
                        }

                        log.debug("Permissions required to execute function: {} are: {}", method.getName(), actualPermissions);
                        return user.getAuthorities().containsAll(actualPermissions);
                    })
                    // If the user is not authorized, the filter will not emit. Hence, we return "Unauthorized"
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                    // The user is authorized to proceed to function execution
                    .then((Mono<?>) joinPoint.proceed());
        } catch (Throwable throwable) {
            return Mono.error(throwable);
        }
    }
}
