package com.appsmith.server.helpers;

import com.appsmith.server.dtos.DslActionDTO;
import org.junit.Test;

import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

public class CompareDslActionDTOTest {


    @Test
    public void convert_whenEmptyActionIdSet_elementsDoesNotMaintainOrder() {
        TreeSet<DslActionDTO> orderedActionSet = new TreeSet<>(new CompareDslActionDTO());
        List<String> sortedActionNames = new LinkedList<>();
        DslActionDTO action1 = new DslActionDTO();
        DslActionDTO action2 = new DslActionDTO();
        action1.setName("");
        action2.setName("abcd");
        Set<DslActionDTO> actionSet = Set.of(action1, action2);
        orderedActionSet.addAll(actionSet);
        for (DslActionDTO dslActionDTO : orderedActionSet) {
            sortedActionNames.add(dslActionDTO.getName());
        }
        // Two lists are defined to be equal if they contain the same elements in the same order.
        assertThat(sortedActionNames).contains("abcd", "");
    }

    @Test
    public void convert_whenNonEmptySet_returnsOrderedResult() {
        TreeSet<DslActionDTO> orderedActionSet = new TreeSet<>(new CompareDslActionDTO());
        List<String> sortedActionIds = new LinkedList<>();
        DslActionDTO action1 = new DslActionDTO();
        DslActionDTO action2 = new DslActionDTO();
        DslActionDTO action3 = new DslActionDTO();
        DslActionDTO action4 = new DslActionDTO();
        DslActionDTO action5 = new DslActionDTO();
        DslActionDTO action6 = new DslActionDTO();
        action1.setName("abc");
        action2.setName("0abc");
        action3.setName("1abc");
        action4.setName("abc0");
        action5.setName("abc1");
        action6.setName("abcd");
        Set<DslActionDTO> actionSet = Set.of(action1, action2, action3, action4, action5, action6);
        orderedActionSet.addAll(actionSet);
        for (DslActionDTO dslActionDTO : orderedActionSet) {
            sortedActionIds.add(dslActionDTO.getName());
        }
        // Two lists are defined to be equal if they contain the same elements in the same order.
        assertThat(sortedActionIds).isEqualTo(List.of("0abc", "1abc", "abc", "abc0", "abc1", "abcd"));
    }
}
