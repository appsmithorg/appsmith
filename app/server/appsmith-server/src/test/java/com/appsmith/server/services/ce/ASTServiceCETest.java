package com.appsmith.server.services.ce;

import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.services.AstService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;

@SpringBootTest
@Slf4j
public class ASTServiceCETest {
    @SpyBean
    AstService astService;

    @Test
    void refactorNameInDynamicBindings_nullOrEmptyBindings_returnsEmptyMono() {
        Mono<Map<MustacheBindingToken, String>> result =
                astService.refactorNameInDynamicBindings(null, "abc", "xyz", 2, false);

        StepVerifier.create(result).verifyComplete();

        result = astService.refactorNameInDynamicBindings(Collections.emptySet(), "abc", "xyz", 2, false);

        StepVerifier.create(result).verifyComplete();
    }

    @Test
    void refactorNameInDynamicBindings_bindingWithoutOldName_returnsUnchangedMap() {
        MustacheBindingToken token1 = new MustacheBindingToken();
        token1.setValue("foo.bar");
        MustacheBindingToken token2 = new MustacheBindingToken();
        token2.setValue("baz.qux");
        Set<MustacheBindingToken> bindings = Set.of(token1, token2);

        Mono<Map<MustacheBindingToken, String>> result =
                astService.refactorNameInDynamicBindings(bindings, "abc", "xyz", 2, false);

        StepVerifier.create(result)
                .assertNext(map -> {
                    assertThat(map).hasSize(2);
                    assertThat(map.get(token1)).isEqualTo("foo.bar");
                    assertThat(map.get(token2)).isEqualTo("baz.qux");
                })
                .verifyComplete();
    }

    @Test
    void refactorNameInDynamicBindings_validBindings_returnsUpdatedBindings() {
        MustacheBindingToken token1 = new MustacheBindingToken();
        token1.setValue("abc['foo']");
        MustacheBindingToken token2 = new MustacheBindingToken();
        token2.setValue("xyz['bar']");
        Set<MustacheBindingToken> bindings = Set.of(token1, token2);

        String refactoredScript1 = "xyz['foo']";
        String refactoredScript2 = "xyz['bar']";

        Map<MustacheBindingToken, String> responseMap1 = Map.of(
                token1, refactoredScript1,
                token2, refactoredScript2);

        doReturn(Mono.just(responseMap1))
                .when(astService)
                .refactorNameInDynamicBindings(Set.of(token1, token2), "abc", "xyz", 2, false);

        Mono<Map<MustacheBindingToken, String>> result =
                astService.refactorNameInDynamicBindings(bindings, "abc", "xyz", 2, false);

        StepVerifier.create(result)
                .assertNext(map -> {
                    assertThat(map).hasSize(2); // Only one binding refactored
                    assertThat(map.get(token1)).isEqualTo(refactoredScript1);
                    assertThat(map.get(token2)).isEqualTo(refactoredScript2);
                })
                .verifyComplete();
    }

    @Test
    void refactorNameInDynamicBindings_whenValidJSObjectRequest_thenReturnUpdatedScript() {
        MustacheBindingToken token = new MustacheBindingToken();
        token.setValue("export default { myFun1() { Api1.run(); return Api1.data;}}");
        Set<MustacheBindingToken> bindingValues = Set.of(token);
        String oldName = "Api1";
        String newName = "GetUsers";
        int evalVersion = 2;
        boolean isJSObject = true;

        String refactoredScript = "export default { myFun1() { GetUsers.run(); return GetUsers.data;}}";

        Map<MustacheBindingToken, String> responseMap = Map.of(token, refactoredScript);

        doReturn(Mono.just(responseMap))
                .when(astService)
                .refactorNameInDynamicBindings(bindingValues, oldName, newName, evalVersion, isJSObject);

        Mono<Map<MustacheBindingToken, String>> resultMono =
                astService.refactorNameInDynamicBindings(bindingValues, oldName, newName, evalVersion, isJSObject);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertThat(result).hasSize(1);

                    MustacheBindingToken key = bindingValues.iterator().next();

                    assertThat(result.containsKey(key)).isTrue();
                    assertThat(result.get(key)).isEqualTo(refactoredScript);
                })
                .verifyComplete();
    }

    @Test
    void refactorNameInDynamicBindings_whenNoMatchingOldNameInJSObject_thenReturnOriginalScript() {
        MustacheBindingToken token = new MustacheBindingToken();
        token.setValue("export default { myFun1() { GetUsers.run(); return GetUsers.data;}}");
        Set<MustacheBindingToken> bindingValues = Set.of(token);

        String oldName = "Api1"; // oldName is not present in the script
        String newName = "GetUsers";
        int evalVersion = 2;
        boolean isJSObject = true;

        String refactoredScript = "export default { myFun1() { GetUsers.run(); return GetUsers.data;}}";

        Map<MustacheBindingToken, String> responseMap = Map.of(token, refactoredScript);

        doReturn(Mono.just(responseMap))
                .when(astService)
                .refactorNameInDynamicBindings(bindingValues, oldName, newName, evalVersion, isJSObject);

        Mono<Map<MustacheBindingToken, String>> resultMono =
                astService.refactorNameInDynamicBindings(bindingValues, oldName, newName, evalVersion, isJSObject);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertThat(result).hasSize(1);

                    MustacheBindingToken key = bindingValues.iterator().next();

                    assertThat(result.containsKey(key)).isTrue();
                    assertThat(result.get(key)).isEqualTo(token.getValue()); // Script remains unchanged
                })
                .verifyComplete();
    }
}
