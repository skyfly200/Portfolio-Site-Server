// [START gae_flex_datastore_app]
'use strict';

require('@google-cloud/debug-agent').start();

const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./config');
const user = require('./user');
const tag = require('./tag');
const post = require('./post');

const app = express();
app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.options('*', cors())

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = Datastore();

app.use('/users', user);
app.use('/posts', post);
app.use('/tags', tag);

// Start Server

const PORT = process.env.PORT || 80;
app.listen(process.env.PORT || 80, () => {
	console.log(`App listening on port ${PORT}`);
	console.log('Press Ctrl+C to quit.');
});

// [END gae_flex_datastore_app]

module.exports = app;
