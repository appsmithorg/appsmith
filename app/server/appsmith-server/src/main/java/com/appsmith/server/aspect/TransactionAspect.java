package com.appsmith.server.aspect;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.helpers.RepositoryFactory;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
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
import java.util.UUID;
import java.util.regex.Pattern;

import static com.appsmith.server.constants.ce.FieldNameCE.*;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class TransactionAspect {

    private final RepositoryFactory repositoryFactory;

    Pattern OBJECTID_PATTERN = Pattern.compile("^[0-9a-fA-F]{24}$");

    @Around("execution(* com.appsmith.server.repositories.cakes..*(..))")
    public Object handleTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        Class<?> returnType =
                ((MethodSignature) joinPoint.getSignature()).getMethod().getReturnType();

        if (Mono.class.isAssignableFrom(returnType)) {
            return Mono.deferContextual(context -> {
                try {
                    if (context.isEmpty() || !context.hasKey(TRANSACTION_CONTEXT)) {
                        return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                    }

                    Map<String, DBOps> transactionContext = context.get(TRANSACTION_CONTEXT);
                    EntityData entityData = getEntityData(joinPoint.getArgs(), joinPoint.getTarget());

                    if (isReadOp(entityData, (MethodSignature) joinPoint.getSignature())) {
                        return handleReadOperation(joinPoint, transactionContext, entityData);
                    } else if (isInsertOrCreateOp(entityData, (MethodSignature) joinPoint.getSignature())) {
                        handleInsertOperation(transactionContext, entityData);
                        return Mono.just(
                                entityData.getBaseDomain()); // Return entity after persisting it to context map
                    } else if (isUpdateOp(entityData)) {
                        return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                    } else if (isDeleteOp((MethodSignature) joinPoint.getSignature())) {
                        return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                    }
                } catch (Throwable e) {
                    log.error(
                            "Error while executing the function in the Transaction Aspect {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Mono.error(e);
                }
                return Mono.empty();
            });
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return Flux.deferContextual(context -> {
                try {
                    if (context.isEmpty() || !context.hasKey(TRANSACTION_CONTEXT)) {
                        return (Flux<?>) joinPoint.proceed(joinPoint.getArgs());
                    }

                    Map<String, DBOps> transactionContext = context.get(TRANSACTION_CONTEXT);
                    EntityData entityData = getEntityData(joinPoint.getArgs(), joinPoint.getTarget());

                    if (isReadOp(entityData, (MethodSignature) joinPoint.getSignature())) {
                        return handleReadOperationFlux(joinPoint, transactionContext, entityData);
                    } else if (isInsertOrCreateOp(entityData, (MethodSignature) joinPoint.getSignature())) {
                        handleInsertOperation(transactionContext, entityData);
                        return Flux.just(
                                entityData.getBaseDomain()); // Return entity after persisting it to context map
                    } else if (isUpdateOp(entityData)) {
                        return (Flux<?>) joinPoint.proceed(joinPoint.getArgs());
                    } else if (isDeleteOp((MethodSignature) joinPoint.getSignature())) {
                        return (Flux<?>) joinPoint.proceed(joinPoint.getArgs());
                    }
                } catch (Throwable e) {
                    log.error(
                            "Error while executing the function in the Transaction Aspect {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Flux.error(e);
                }
                return Flux.empty();
            });
        }
        return joinPoint.proceed(joinPoint.getArgs());
    }

    private Mono<?> handleReadOperation(
            ProceedingJoinPoint joinPoint, Map<String, DBOps> transactionContext, EntityData entityData)
            throws Throwable {
        return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs()))
                .switchIfEmpty(Mono.defer(() -> {
                    String id = entityData.getId();
                    return Mono.justOrEmpty(transactionContext.get(id)).map(DBOps::getEntity);
                }))
                .map(obj -> updateContextMapWithReadOperation(transactionContext, obj));
    }

    private Flux<?> handleReadOperationFlux(
            ProceedingJoinPoint joinPoint, Map<String, DBOps> transactionContext, EntityData entityData)
            throws Throwable {
        return ((Flux<?>) joinPoint.proceed(joinPoint.getArgs()))
                .switchIfEmpty(Flux.defer(() -> {
                    String id = entityData.getId();
                    return Flux.justOrEmpty(transactionContext.get(id)).map(DBOps::getEntity);
                }))
                .map(obj -> updateContextMapWithReadOperation(transactionContext, obj));
    }

    private void handleInsertOperation(Map<String, DBOps> transactionContext, EntityData entityData) {
        BaseDomain domain = entityData.getBaseDomain();
        DBOps dbOps = new DBOps();
        dbOps.setEntity(domain);
        dbOps.setNew(true);
        transactionContext.put(domain.getId(), dbOps);
    }

    private boolean isReadOp(EntityData entityData, MethodSignature signature) {
        String methodName = signature.getMethod().getName();
        return methodName.startsWith(FIND) || methodName.startsWith(GET);
    }

    private boolean isInsertOrCreateOp(EntityData entityData, MethodSignature signature) {
        String methodName = signature.getMethod().getName();
        return (methodName.contains("save") || methodName.contains("saveAll"))
                && (entityData.getBaseDomain() != null
                        && entityData.getBaseDomain().getId() == null);
    }

    private boolean isUpdateOp(EntityData entityData) {
        return entityData.getUpdate() instanceof BridgeUpdate;
    }

    private boolean isDeleteOp(MethodSignature signature) {
        String methodName = signature.getMethod().getName();
        return methodName.contains(DELETE);
    }

    private EntityData getEntityData(Object[] args, Object target) {
        EntityData entityData = new EntityData();
        for (Object arg : args) {
            if (arg instanceof BaseDomain domain) {
                entityData.setBaseDomain(domain);
            } else if (arg instanceof String && (isUUIDString((String) arg) || isObjectIdString((String) arg))) {
                entityData.setId((String) arg);
            } else if (arg instanceof BridgeUpdate) {
                entityData.setUpdate((BridgeUpdate) arg);
            }
        }

        if (entityData.getBaseDomain() != null) {
            if (entityData.getBaseDomain().getId() == null && entityData.getId() != null) {
                entityData.getBaseDomain().setId(entityData.getId());
            } else if (entityData.getBaseDomain().getId() == null && entityData.getId() == null) {
                entityData.getBaseDomain().setId(generateId());
                entityData.setId(entityData.getBaseDomain().getId());
            } else if (entityData.getId() == null) {
                entityData.setId(entityData.getBaseDomain().getId());
            }
        }
        return entityData;
    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }

    private boolean isUUIDString(String id) {
        try {
            UUID.fromString(id);
            return true;
        } catch (IllegalArgumentException e) {
            log.error("Error while parsing the UUID {}", id);
            return false;
        }
    }

    private boolean isObjectIdString(String id) {
        return OBJECTID_PATTERN.matcher(id).matches();
    }

    private Object updateContextMapWithReadOperation(Map<String, DBOps> transactionContext, Object obj) {
        if (obj instanceof BaseDomain) {
            DBOps dbOps = new DBOps();
            dbOps.setEntity(obj);
            dbOps.setModified(false);
            String id = getObjectId(dbOps);
            transactionContext.putIfAbsent(id, dbOps);
        }
        return obj;
    }

    private String getObjectId(DBOps obj) {
        return obj != null && obj.getEntity() instanceof BaseDomain ? ((BaseDomain) obj.getEntity()).getId() : null;
    }

    @Getter
    @Setter
    public static class EntityData {
        private BaseDomain baseDomain;
        private BridgeUpdate update;
        private String id;
    }

    @Getter
    @Setter
    public static class DBOps {
        private Object entity;
        private boolean isNew;
        private boolean isModified;
    }
}
