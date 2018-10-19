/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// [START gae_flex_datastore_app]
'use strict';

const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
var cors = require('cors');

const app = express();
app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = Datastore();

const signatureKey = datastore.key('signature');

/**
 * Insert a signature record into the database.
 *
 * @param {object} signature The signature record to insert.
 */
function insertSignature (signature) {
	getCount()
	.then((count) => {
		signature.count = count ? count + 1 : 1;
	  	datastore.insert({
			key: signatureKey,
			data: signature,
		});
		return signature;
	});
}

function getCount () {
  const query = datastore.createQuery('signature').order('timestamp', { descending: true }).limit(1);

  return datastore.runQuery(query)
    .then((results) => {
      const entities = results[0];
      return entities[0].count;
    });
}

app.get('/count', (req, res, next) => {
	getCount()
	.then((count) => {
      res.status(200).json({count});
    })
    .catch(next);
});

app.post('/submit', (req, res) => {
  // Create a signature record to be stored in the database
  const signature = {
  	timestamp: new Date(),
    // Store a hash of the visitor's ip address
    userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0, 7),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    message: req.body.message
  };
  
  res.send(insertSignature(signature));
  
});

const PORT = process.env.PORT || 8080;
app.listen(process.env.PORT || 8080, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_flex_datastore_app]

module.exports = app;
