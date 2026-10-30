package com.appsmith.server.dtos;

import com.appsmith.server.domains.Layout;
import net.minidev.json.JSONObject;

/**
 * Request body for a layout update.
 *
 * @param dsl              the new layout DSL.
 * @param expectedRevision optional page revision from a layout read (epoch milliseconds). When set, the server refuses
 *                         the update if the page changed after that read. When null, the update is unconditional.
 */
public record LayoutUpdateDTO(JSONObject dsl, String expectedRevision) {

    public LayoutUpdateDTO(JSONObject dsl) {
        this(dsl, null);
    }

    public Layout toLayout() {
        Layout layout = new Layout();
        layout.setDsl(dsl);
        return layout;
    }
}
