package com.appsmith.server.helpers;

import com.appsmith.external.dtos.DslExecutableDTO;
import org.junit.jupiter.api.Test;

import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

public class CompareDslExecutableDTOTest {

    @Test
    public void convert_whenEmptyActionIdSet_elementsDoesNotMaintainOrder() {
        TreeSet<DslExecutableDTO> orderedActionSet = new TreeSet<>(new CompareDslActionDTO());
        List<String> sortedActionNames = new LinkedList<>();
        DslExecutableDTO action1 = new DslExecutableDTO();
        DslExecutableDTO action2 = new DslExecutableDTO();
        action1.setName("");
        action2.setName("abcd");
        Set<DslExecutableDTO> actionSet = Set.of(action1, action2);
        orderedActionSet.addAll(actionSet);
        for (DslExecutableDTO dslExecutableDTO : orderedActionSet) {
            sortedActionNames.add(dslExecutableDTO.getName());
        }
        // Two lists are defined to be equal if they contain the same elements in the same order.
        assertThat(sortedActionNames).contains("abcd", "");
    }

    @Test
    public void convert_whenNonEmptySet_returnsOrderedResult() {
        TreeSet<DslExecutableDTO> orderedActionSet = new TreeSet<>(new CompareDslActionDTO());
        List<String> sortedActionIds = new LinkedList<>();
        DslExecutableDTO action1 = new DslExecutableDTO();
        DslExecutableDTO action2 = new DslExecutableDTO();
        DslExecutableDTO action3 = new DslExecutableDTO();
        DslExecutableDTO action4 = new DslExecutableDTO();
        DslExecutableDTO action5 = new DslExecutableDTO();
        DslExecutableDTO action6 = new DslExecutableDTO();
        action1.setName("abc");
        action2.setName("0abc");
        action3.setName("1abc");
        action4.setName("abc0");
        action5.setName("abc1");
        action6.setName("abcd");
        Set<DslExecutableDTO> actionSet = Set.of(action1, action2, action3, action4, action5, action6);
        orderedActionSet.addAll(actionSet);
        for (DslExecutableDTO dslExecutableDTO : orderedActionSet) {
            sortedActionIds.add(dslExecutableDTO.getName());
        }
        // Two lists are defined to be equal if they contain the same elements in the same order.
        assertThat(sortedActionIds).isEqualTo(List.of("0abc", "1abc", "abc", "abc0", "abc1", "abcd"));
    }
}
