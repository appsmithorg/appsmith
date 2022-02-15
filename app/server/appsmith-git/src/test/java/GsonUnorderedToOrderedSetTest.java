import com.appsmith.git.converters.GsonUnorderedToOrderedSetConverter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.junit.Before;
import org.junit.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class GsonUnorderedToOrderedSetTest {
    private Gson gson;

    @Before
    public void setUp() {
        gson = new GsonBuilder()
                .registerTypeAdapter(Set.class, new GsonUnorderedToOrderedSetConverter())
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
}
