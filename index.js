/*
 * Primary file for API
 *
 */

// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const fs = require("fs");

// Instantiate the HTTP server
const httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function() {
  console.log("The server is listening on port " + config.httpPort);
});

// Instantiate the HTTPS server
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};

const httpsServer = http.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function() {
  console.log("The server is listening on port " + config.httpsPort);
});

// All the server logic for both the http and https server
const unifiedServer = function(req, res) {
  // Parse the url
  const parseUrl = url.parse(req.url, true);

  // Get the path
  const path = parseUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  const queryStringObject = parseUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", function(data) {
    buffer += decoder.write(data);
  });

  req.on("end", function() {
    buffer += decoder.end();

    // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {
      // Use the payload returned from the handler, or set the default payload to an empty object
      payload = typeof payload == "object" ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log(trimmedPath, statusCode);
    });
  });
};

// Define all the handlers
const handlers = {};

// Ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Hello handler
handlers.hello = function(data, callback) {
  console.log(data);
  callback(200, {
    message: `Hello ${
      data.queryStringObject.name !== undefined ? data.queryStringObject.name : ""
    } 😃`,
    language: data.queryStringObject.lang !== undefined ? data.queryStringObject.lang : ""
  });
};

// Not-Found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Define the request router
const router = {
  ping: handlers.ping,
  hello: handlers.hello
};
