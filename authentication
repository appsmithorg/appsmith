# How to implement custom authentication on Appsmith
In this guide, you'll learn how to implement this custom Auth using JWTs by chaining multiple steps.

---


## [YOUTUBE](https://www.youtube.com/embed/5oPcF9dXZyU)


---

A lot of applications use Authentication APIs to secure their information. You can use those API's on Appsmith to build UI or tools using a custom authentication mode. In this guide, you'll learn how to implement this custom Auth using JWTs by chaining multiple steps.

##  Building UI for Login Form

The auth APIs require a login form. Hence let’s build one on Appsmith. Follow the below steps:

1. Firstly, log in to your Appsmith account; if you’re new, sign-up here (it’s free)!.

2. Now create a new application by clicking on the `Create New` button on the dashboard.

3. Next, click on the + icon next to widgets from the side navigation and drag and drop a form widget onto the canvas.

4. Now let’s add two text widgets and input widgets to create our login form. Rename the input widgets to following:

5. Username Input Widget: userName 

6. Password Input: password

This is a screenshot of how the login form looks like:

<img src="https://lh3.googleusercontent.com/ZumVJGnKnwENgd_sVX-hv9BxWUjINUh0ClOZfGQqIhXKQXOJLpNG51phXV5CRriuSQnWOgtbA1vk0gDz2epQk2CNv5iWJbUXAZ2HpsG5Jma0pZkBtLmgTCGLnPMO0cC4ahcm8vsI">

Let's use these values in an Auth API; usually, login API requires a username and a password. In this example, we'll be using the same, which will return a JWT token and the user details with his permission roles. Here’s how the output looks like after running the API:
~~~
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNjIyNzE1MTU0LCJleHAiOjE2MjUzMDcxNTR9.rqkR0bVR5g0k8awGTYDEQ0vr15H7401zxkTxpWp9Mc4",
  "user": {
    "id": 2,
    "username": "Vihar",
    "email": "vihar@appsmith.com",
    "provider": "local",
    "confirmed": true,
    "blocked": false,
    "role": {
      "id": 1,
      "name": "Authenticated",
      "description": "Default role given to authenticated user.",
      "type": "authenticated"
    },
    "created_at": "2021-06-03T03:10:37.945Z",
    "updated_at": "2021-06-03T03:10:37.952Z"
  }
}
~~~

Now, let’s create an API that’ll return the JWT using the login API. Follow the below steps:

• Click on the + icon next to the APIs in the side navigation.

• This will create a new API, now add the URL for the Login API

• Set the API name as login_api.

To test this out, we’ve created a test Auth API; use the following if you don’t have any Auth APIs.

• In this example, let’s use https://appsmith-tutorial-apis.herokuapp.com/auth/local, set the request type to POST.

• Next, in the body, add the following JSON to send username and password to the API. IN this case, we’re taking the inputs from the form using the moustache syntax.

~~~
{
  "identifier":"{{userName.text}}",
  "password":"{{password.text}}"
}
~~~

• Next, add a username and password based on the user’s roles in your API. If you’re using the example AUTH Api, use the following credentials.

~~~
Identifier: appsmith_user
Password: appsmith_password
~~~

Awesome, now we’ll need to save the JWT token generated after the API is run. Appsmith has a store where you can save all the variables; for this, we’ll need to use the moustache syntax after the API is successfully run. Below are the steps.


1. Firstly, open the Submit button property pane and set the onClick property to Call an API and choose call_an_api

2. Next, set the onSuccess property to `Store a value` and name the key as jwt and value as {{login_api.data.jwt}}

This will save the jwt token from the API response. This is how the screenshot looks like:

<img src="https://lh4.googleusercontent.com/-onVg-gGl_Uu0QouR3NBmL1tggxEuklnoI_2i7D1fBgam6K3TvRUbpDviuv0kAhWVfGA-xT-vy0S_wyRdO7zzEk52IzK3_Pm5s7KDzpj5ceCYRi7ftrGykOBJSqr6566Qn2_mPZy">


Now we’ll be passing this jwt variable in the header with an Authorization mode to access the secure APIs. As an example, let’s create a secure page and test it out.

• Now, let’s add a new page and access the data from the secure API. 

• Create a new API by clicking on the + icon next to the APIs section. 

• Now add you’re secure API, or you can use the following example AP

~~~
https://appsmith-tutorial-apis.herokuapp.com/logistics

~~~

• This API requires authorization, lets now add a new header with key and value as:

Authorization: Bearer {{appsmith.store.jwt}}

• As we can see, in the place of the token, we’re using the moustache syntax and binding the jwt token that’s saved from the login-api.

• Now run the API, you should see the response.

In this way, you can use a custom login on Appsmith. Additionally, you can customise the redirections based on the authentication mode and your use case.


