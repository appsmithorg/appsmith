package com.appsmith.server.aspect;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@Aspect
@Component
@Slf4j
public class TransactionAspect {
    @Around("execution(* com.appsmith.server.repositories.cakes..*(..))")
    public Object handleTransaction(ProceedingJoinPoint joinPoint) throws Throwable {

        Class<?> returnType =
                ((MethodSignature) joinPoint.getSignature()).getMethod().getReturnType();

        if (Mono.class.isAssignableFrom(returnType)) {
            return Mono.deferContextual(context -> {
                try {
                    // transaction context is not maintained
                    if (context.isEmpty() || !context.hasKey("transactionContext")) {
                        return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                    }
                    Map<String, DBOps> transactionContext = context.get("transactionContext");
                    // Check if it's a write operation
                    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                    String methodName = signature.getMethod().getName();
                    boolean isWriteOp = false;
                    if (methodName.contains("save")
                            || methodName.contains("update")
                            || methodName.contains("delete")
                            || methodName.contains("insert")
                            || methodName.contains("archive")) {
                        isWriteOp = true;
                    }

                    // If the operation is a read operation
                    // 1. Get the object from DB
                    // 2. Check if the object is already present in the context:
                    //      - If not, store the object in the context and return
                    //      - If yes, then return the object as is. We want to just maintain the initial state of the
                    // object as we are concerned with the objects initial state before the transaction started
                    if (!isWriteOp) {
                        return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs())).map(obj -> {
                            if (obj instanceof BaseDomain) {
                                DBOps dbOps = new DBOps();
                                dbOps.setEntity(obj);
                                String id = getObjectId(dbOps);
                                if (!transactionContext.containsKey(id)) {
                                    transactionContext.put(id, dbOps);
                                }
                                return obj;
                            }
                            return obj;
                        });
                    }

                    // TODO
                    // If the operation is a write operation
                    // 1. Extract the id of the object
                    // 2. Check if the object is already present in the context
                    //      a. If yes execute the DB call
                    //      b. If not get the initial state of the object from DB using findById method on the
                    // repository class
                    //          - If end up in switchIfEmpty means no object is present in the DB and should mark this
                    // as a new object and store the object in DB
                    //          - If object is present in the DB, then store the initial state in the context

                    return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                } catch (Throwable e) {
                    log.error(
                            "Error occurred while invoking function {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Mono.error(e);
                }
            });
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return Flux.deferContextual(context -> {
                // Map<String, DBOps<?>> transactionContext = context.get("transactionContext");
                try {
                    return (Flux<?>) joinPoint.proceed(joinPoint.getArgs());
                } catch (Throwable e) {
                    log.error(
                            "Error occurred while adding the user context to the permission object when invoking function {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Flux.error(e);
                }
            });
        }
        return joinPoint.proceed(joinPoint.getArgs());
    }

    private String getObjectId(DBOps obj) {
        return obj != null && obj.getEntity() instanceof BaseDomain ? ((BaseDomain) obj.getEntity()).getId() : null;
    }

    @Getter
    @Setter
    public static class DBOps {
        private Object entity;
        private boolean isModified;
        private boolean isNew;
    }
}
