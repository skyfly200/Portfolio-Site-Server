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
app.use(express.json());

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = Datastore();

// convert to async await
async function insertSignature (req) {
	let count = await getCount();
	// Create a signature record to be stored in the database
	const signature = {
		timestamp: new Date(),
	    // Store a hash of the visitor's ip address
	    userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0, 7),
	    count: count + 1,
	    firstName: req.body.firstName,
	    lastName: req.body.lastName,
	    email: req.body.email,
	    city: req.body.city,
	    state: req.body.state,
	    zip: req.body.zip,
	    message: req.body.message
	};
  	let result = await datastore.insert({
		key: datastore.key(['signature', signature.email]),
		data: signature,
	});
	return {
		result: result,
		entry: signature,
	};
}

async function getEmail (email) {
	const query = datastore.createQuery('signature').filter('email',email);
	let result = await datastore.runQuery(query);
	return result[0];
}


async function getCount () {
	const query = datastore.createQuery('signature').order('timestamp', { descending: true }).limit(1);
	let results = await datastore.runQuery(query);
    const entities = results[0];
    if (entities[0] && entities[0].count) return entities[0].count;
    return 0;
}

app.get('/count', (req, res, next) => {
	getCount()
	.then((count) => {
      res.status(200).json({count});
      next();
    })
	.catch( (error) => {
		res.status(204).json(error);
		console.error(error);
		next();
	});
});

app.post('/submit', (req, res, next) => {
	insertSignature(req)
	.then( (entry) => {
		res.status(200).json(entry);
  		next();
	})
	.catch( (error) => {
		res.status(204).json(error);
		console.log(error);
		next();
	});
});

const PORT = process.env.PORT || 8080;
app.listen(process.env.PORT || 8080, () => {
	console.log(`App listening on port ${PORT}`);
	console.log('Press Ctrl+C to quit.');
});

// [END gae_flex_datastore_app]

module.exports = app;
