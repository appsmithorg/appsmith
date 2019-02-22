package rest

// This package will contain the code for making outbound REST API calls
// to client's backend servers

// API is the struct type for the implmentations
type API struct {
	Headers     struct{}
	QueryParams []struct{}
	URI         string
	Cookies     string
}

// Interface is the generic interface for all implementations of Rest API calls
type Interface interface {
}
