package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"gitlab.com/mobtools/internal-tools-server/models"
	"gitlab.com/mobtools/internal-tools-server/url"
)

func Login(res http.ResponseWriter, req *http.Request) {
	//TODO: If the user is logged in, redirect to the home page
	log.Println("In the login page")
	res.Header().Set("Content-Type", "text/html")
	res.WriteHeader(200)
	fmt.Fprintf(res, "%s", "<p>Click <a href='/auth/google'>here</a> to login via Google</p>")
}

func InitiateAuth(res http.ResponseWriter, req *http.Request) {
	log.Println("In the initiateAuth fxn")
	gothic.BeginAuthHandler(res, req)
}

func AuthCallback(res http.ResponseWriter, req *http.Request) {
	log.Println("In the AuthCallback fxn")
	user, err := completeAuthCallback(res, req)

	if err != nil {
		fmt.Fprintln(res, err)
		return
	}
	res.Header().Set("Content-Type", "application/json")
	res.WriteHeader(200)
	fmt.Fprintf(res, "%s", user.Email)
}

func Logout(res http.ResponseWriter, req *http.Request) {
	gothic.Logout(res, req)
	res.Header().Set("Location", url.LoginURL)
	res.WriteHeader(http.StatusTemporaryRedirect)
}

func GetUserProfile(res http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	providerName := vars["provider"]
	provider, err := goth.GetProvider(providerName)
	if err != nil {
		fmt.Fprintf(res, "%s", err)
	}

	value, err := gothic.GetFromSession(providerName, req)
	if err != nil {
		fmt.Fprintf(res, "%s", err)
	}

	log.Printf("Got the session value: %+v\n", value)

	sess, err := provider.UnmarshalSession(value)
	if err != nil {
		fmt.Fprintf(res, "%s", err)
	}
	log.Printf("Got the session: %+v\n", sess)

	user, err := provider.FetchUser(sess)
	if err == nil {
		// user can be found with existing session data
		fmt.Fprintf(res, "%s", err)
	}
	log.Printf("Got the user: %+v", user)

	fmt.Fprintf(res, "%s", user.Email)
}

func completeAuthCallback(res http.ResponseWriter, req *http.Request) (goth.User, error) {
	log.Println("In the custom callback fxn")
	providerName, err := gothic.GetProviderName(req)
	if err != nil {
		return goth.User{}, err
	}

	provider, err := goth.GetProvider(providerName)
	if err != nil {
		return goth.User{}, err
	}

	value, err := gothic.GetFromSession(providerName, req)
	if err != nil {
		return goth.User{}, err
	}
	log.Printf("Session Value: %+v\n", value)

	sess, err := provider.UnmarshalSession(value)
	if err != nil {
		return goth.User{}, err
	}

	// get new token and retry fetch
	_, err = sess.Authorize(provider, req.URL.Query())
	if err != nil {
		return goth.User{}, err
	}

	gu, err := provider.FetchUser(sess)
	if err != nil {
		return goth.User{}, err
	}
	log.Printf("Got the gu as: %+v", gu)

	user := models.User{
		Username: gu.Email,
		Email:    gu.Email,
		GothUser: gu,
	}

	userJSON, _ := json.Marshal(user)
	log.Printf("userJSON Value: %+v\n", string(userJSON))

	err = gothic.StoreInSession(providerName, string(userJSON), req, res)

	return gu, err
}

func getAuthenticatedUser(res http.ResponseWriter, req *http.Request) (string, error) {
	sess, err := gothic.GetFromSession("google", req)
	if err != nil {
		return "", err
	}
	log.Printf("Got the authenticated user: %+v\n", sess)
	return sess, nil
}
