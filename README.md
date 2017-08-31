# Spika Backend

Spika Backend is backend system for Spika Web/iOS/Android client. To setup this you need to have Linux based server with root permission.

## Installing Spika Backend to Ubuntu 14.04

####  1. Setup environment

```{r, engine='bash', count_lines}

$ sudo apt-get update

$ sudo apt-get install git mongodb npm nodejs imagemagick yarn

# It is only for Ubuntu 14.04
$ ln -s /usr/bin/nodejs /usr/bin/node

$ git clone https://git.frogeducation.com/titan/frog-chat-backend

$ cd frog-chat-backend

$ yarn

$ yarn global add gulp
```

#### 2. Input the Environment Variables

Here is the list of Environment Variables need to be added to the OS:
```
#ENV_VAR list
#If any variable is not provided, it will take default value which is used for development
#For example(APP_HOST = localhost / APP_PORT = 8081)

APP_HOST
APP_PORT
URL_PREFIX
SOCKET_NAMESPACE

MONGO_USERNAME
MONGO_PASSWORD
MONGO_HOST
MONGO_PORT
MONGO_DBNAME

NSMI_SECRET_KEY
JWT_SECRET_KEY
FCM_SERVER_API_KEY
LOGIN_SECRET_KEY

REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
REDIS_PUBSUB_HOST
REDIS_PUBSUB_PORT
REDIS_PUBSUB_PASSWORD
```

Example:
- Provide the env_var within the current SHELL:
```$ export VAR_NAME=var_value (eg. $ export APP_HOST='https://IP_of_server_goes_here')```

- Permanently set to os:
``` Add variables above into etc/environment```
This requires log-off and log-in again.

####4. Start Mongo.
```
$ sudo mongod --config /etc/mongod.conf
```

####5. Install and start redis
```
# These commands for DEV environment
$ install redis
$ sudo apt-get install redis-server
$ sudo start redis-server
```

Note:
Make sure Redis and Mongo started before start server!

####6. Generate public files and start server.
```{r, engine='bash', count_lines}
# Generate files in public dir
$ gulp build-dist

# Start server in stand alone mode
$ node src/server/main.js
```


####7. Open standalone web client in browser
http[s]://host:port/[urlPrefix]

ex): http://45.55.81.215/spika/


