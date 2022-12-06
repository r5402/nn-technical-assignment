# NN Technical Assignment

This repository is my take on the technical assignment sent by Jeroen and Daniëlle.

It consists of a single function called `api` that handles all incoming requests, using Express.js for routing and internal handling of requests.

The application exposes four endpoints, `POST /signup` and `POST /signin`, which allow one to register and authenticate as an advisor and `POST /products` and `GET /products` which let an advisor create and retrieve products.

## Usage

### Deployment

Install dependencies with:

```
npm install
```

and then deploy with:

```
serverless deploy
```

### Making requests

After deploying, you should be able to first create an account by calling:


```bash
curl --request POST 'https://xtxoiylcvh.execute-api.us-east-1.amazonaws.com/signup' --header 'Content-Type: application/json' --data-raw '{"email": "richard@nn.nl", "password": "notasafepassword", "name": "Richard"}'
```

Which should result in:

```bash
{"id":"a-regular-uuid","token":"a.regular.jwt"}
```

Or, if the email provided is already being used by another advisor:

```bash
{"error":"An advisor with this email is already registered"}
```

You can later get the token again by using the sign-in endpoint like:

```bash
curl --request POST 'https://xtxoiylcvh.execute-api.us-east-1.amazonaws.com/signin' --header 'Content-Type: application/json' --data-raw '{"email": "richard@nn.nl", "password": "notasafepassword"}'
```

To create a product, simply use the token that was returned when signing up or signing in as a Bearer token, and POST to the products endpoint like:

```bash
curl --request POST 'https://xtxoiylcvh.execute-api.us-east-1.amazonaws.com/products' --header 'Authorization: Bearer a.regular.jwt' --header 'Content-Type: application/json' --data-raw '{"name": "Rubber duck", "description": "Quack.", "price": 1}'
```

This should return the object of the created product.

To retrieve all products for your account, make a GET request for the same route, also passing the token.

You can use this URL to test if you don't want to deploy the service yourself: https://xtxoiylcvh.execute-api.us-east-1.amazonaws.com/

## Considerations

I have implemented the service for the assignment in the simplest way possible.

Because the goal was to not spend too much time on it, I made specific decisions I would not normally do.

For a project like this one, there are also many possibilities and combinations of tools and technologies, which I would love to discuss more.

This was a super fun challenge, and I am looking forward to talking to you guys at NN!