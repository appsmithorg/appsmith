package com.appsmith.server.dtos;

import com.appsmith.server.domains.Layout;
import net.minidev.json.JSONObject;

public record LayoutUpdateDTO(JSONObject dsl) {
    public Layout toLayout() {
        Layout layout = new Layout();
        layout.setDsl(dsl);
        return layout;
    }
}
