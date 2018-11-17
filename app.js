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
async function insertPost (req) {
	// Create a post record to be stored in the database
	const post = {
			datetime: req.body.datetime,
	    title: req.body.title,
	    body: req.body.body,
	    tags: req.body.tags,
			key: req.body.key
	};
  let result = await datastore.insert({
		key: datastore.key(['post', post.key]),
		data: post,
	});
	for (tag in post.tags) tagLink(tag, post.key);
	return result;
}

async function tagLink (tag, post) {
	const transaction = datastore.transaction();
	transaction.run((err) => {
	  if (err) {}
	  const key = datastore.key(['tag', tag.toLowerCase()]);
	  transaction.get(key, (err, entity) => {
	    if (err) {}
			let update = entity ? entity : [];
	    update.posts.append(post);
	    transaction.save(entity);
	    transaction.commit((err) => {
	      if (!err) {}
	    });
	  });
	});
}

async function getPost (key) {
	const query = datastore.createQuery('post').filter('__key__', key);
	let result = await datastore.runQuery(query);
	return result[0];
}

async function getPostsByTag (tag) {
	const transaction = datastore.transaction();
	transaction.run((err) => {
	  if (err) {}
		const query = datastore.createQuery('tag').filter('__key__', tag)
	  query.run((err, entities) => {
	    if (err) {}
			const request = {
			  projectId: '',
			  keys: entities,
			};
			transaction.lookup(request)
			  .then(responses => {
			    const response = responses[0];
			    return response;
			  })
			  .catch(err => {
			    console.error(err);
			  });
	    transaction.commit((err) => {
	      if (!err) {
	        // Transaction committed successfully.
	      }
	    });
	  });
	});
}

async function getPosts () {
	const query = datastore.createQuery('post').order('datetime', { descending: true });
	let results = await datastore.runQuery(query);
    const entities = results[0];
    if (entities) return entities;
    return 0;
}

app.get('/posts', (req, res, next) => {
	getPosts()
	.then((posts) => {
      res.status(200).json({posts});
      next();
    })
	.catch( (error) => {
		res.status(204).json(error);
		console.error(error);
		next();
	});
});

app.post('/submit', (req, res, next) => {
	insertPost(req)
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
