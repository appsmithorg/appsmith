package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.Layout;

import java.util.List;

public interface LayoutContainer {
    List<Layout> getLayouts();

    void setLayouts(List<Layout> layouts);

    String getId();
}
