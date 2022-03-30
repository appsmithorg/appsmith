import com.appsmith.git.converters.GsonUnorderedToOrderedConverter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.junit.Before;
import org.junit.Test;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class GsonUnorderedToOrderedSerializationTest {
    private Gson gson;

    @Before
    public void setUp() {
        gson = new GsonBuilder()
                .registerTypeAdapter(Set.class, new GsonUnorderedToOrderedConverter())
                .registerTypeAdapter(Map.class, new GsonUnorderedToOrderedConverter())
                .create();
    }

    @Test
    public void convert_whenEmptySet_returnsEmptyArrayString() {
        Set data = new HashSet();
        String orderedData = gson.toJson(data);
        assertThat(orderedData).isEqualTo("[]");
    }

    @Test
    public void convert_whenNullSet_returnsNullString() {
        String orderedData = gson.toJson((Object) null);
        assertThat(orderedData).isEqualTo("null");
    }

    @Test
    public void convert_withNonEmptySet_returnsOrderedArrayString() {
        Set data = Set.of("abcd", "abc", "abcd1", "1abcd","xyz", "1xyz", "0xyz");
        String orderedData = gson.toJson(data, Set.class);
        assertThat(orderedData).isEqualTo("[\"0xyz\",\"1abcd\",\"1xyz\",\"abc\",\"abcd\",\"abcd1\",\"xyz\"]");
    }

    @Test
    public void convert_withNullMap_returnsOrderedMapString() {
        String orderedData = gson.toJson(null, Map.class);
        assertThat(orderedData).isEqualTo("null");
    }

    @Test
    public void convert_withEmptyMap_returnsOrderedMapString() {
        Map<String, String> data = Map.of();
        String orderedData = gson.toJson(data, Map.class);
        assertThat(orderedData).isEqualTo("{}");
    }

    @Test
    public void convert_withNonEmptyMap_returnsOrderedMapString() {
        Map<String, String> data = Map.of("key2", "value2", "key1", "value1","0key", "value0");
        String orderedData = gson.toJson(data, Map.class);
        assertThat(orderedData).isEqualTo("{\"0key\":\"value0\",\"key1\":\"value1\",\"key2\":\"value2\"}");
    }
}
