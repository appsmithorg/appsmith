package com.appsmith.server.helpers;

import com.appsmith.server.dtos.DslActionDTO;
import org.apache.commons.lang.StringUtils;

import java.io.Serializable;
import java.util.Comparator;

public class CompareDslActionDTO implements Comparator<DslActionDTO>, Serializable {
    // Method to compare DslActionDTO based on id
    @Override
    public int compare(DslActionDTO action1, DslActionDTO action2) {
        if (action1 != null && !StringUtils.isEmpty(action1.getName())
                && action2 != null && !StringUtils.isEmpty(action2.getName())) {
            return action1.getName().compareTo(action2.getName());
        }
        return 1;
    }
}
