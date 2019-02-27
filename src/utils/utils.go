package utils

import (
	"fmt"
	"reflect"
)

// ConvertMapToStruct converts a given map into a struct object
func ConvertMapToStruct(obj interface{}, objTags interface{}, m map[string]interface{}) error {
	tags, _ := getTags(objTags)
	for key, value := range m {
		err := setField(obj, tags, key, value)
		if err != nil {
			return err
		}
	}
	return nil
}

func setField(obj interface{}, tags map[string]string, name string, value interface{}) error {
	structValue := reflect.ValueOf(obj).Elem()

	// structFieldName := structValue.FieldByName(name)
	structFieldName := structValue.FieldByName(tags[name])
	if !structFieldName.IsValid() {
		return fmt.Errorf("No such field: %s in obj", name)
	}

	if !structFieldName.CanSet() {
		return fmt.Errorf("Cannot set field: %s in obj", name)
	}
	structFieldType := structFieldName.Type()
	val := reflect.ValueOf(value)
	if structFieldType != val.Type() {
		return fmt.Errorf("Provided value type doesn't match obj field type")
	}
	structFieldName.Set(val)
	return nil
}

// getTags stores all the tags of the struct in a map along with the name of the field
func getTags(obj interface{}) (tags map[string]string, err error) {
	tags = make(map[string]string)
	objType := reflect.TypeOf(obj)
	for i := 0; i < objType.NumField(); i++ {
		field := objType.Field(i)
		tag := field.Tag.Get("sql")
		tags[tag] = field.Name
	}
	return tags, nil
}
