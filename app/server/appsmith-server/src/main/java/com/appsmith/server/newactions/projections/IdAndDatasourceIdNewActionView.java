package com.appsmith.server.newactions.projections;

import lombok.Getter;

/**
 * This projection is used to fetch only the id and datasource id of an action.
 * <p>
 * Nested projections are not working with JPA projections using interfaces because of a limitation in the way that
 * Spring Data JPA handles projections. When you use an interface to define a projection, Spring Data JPA creates a
 * dynamic proxy for the interface. This proxy is used to intercept calls to the getter methods on the interface and
 * return the appropriate data from the database.
 * However, when you try to use a nested projection, Spring Data JPA cannot create a dynamic proxy for the nested
 * projection interface. This is because the nested projection interface is not a top-level interface. As a result,
 * Spring Data JPA cannot intercept calls to the getter methods on the nested projection interface and return the
 * appropriate data from the database.
 * To work around this limitation, you can define the nested projection as a static inner class of the top-level.
 * </p>
 */
@Getter
public class IdAndDatasourceIdNewActionView {

    String id;
    ActionDTODatasourceView unpublishedAction;

    @Getter
    public static class ActionDTODatasourceView {
        DatasourceIdView datasource;
    }

    @Getter
    public static class DatasourceIdView {
        String id;
    }
}
