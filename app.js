// [START gae_flex_datastore_app]
'use strict';

require('@google-cloud/debug-agent').start();

const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const user = require('./user');
const tag = require('./tag');
const post = require('./post');

const app = express();
app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.options('*', cors())

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
