package com.appsmith.server.helpers;

import com.appsmith.server.dtos.DBOpsType;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Helpers for dry-ops maps. Import code collects the entities it will write in one bulk operation in a dry-ops map,
 * grouped by {@link DBOpsType}.
 */
public final class DryOpsUtils {

    private DryOpsUtils() {}

    /**
     * Adds {@code entity} to the {@code opsType} list in {@code dryOps}.
     *
     * <p>Import code passes one dry-ops map to calls made inside {@code Flux.flatMap}. Their reactive callbacks run on
     * different threads at the same time. This method locks the map for the whole get-or-create-and-add, so no entity
     * is lost, whatever {@code Map} implementation the caller passes. Read the map only after the pipeline that fills
     * it has completed.
     */
    public static <T> void addDryOp(Map<DBOpsType, List<T>> dryOps, DBOpsType opsType, T entity) {
        synchronized (dryOps) {
            dryOps.computeIfAbsent(opsType, key -> new ArrayList<>()).add(entity);
        }
    }
}
