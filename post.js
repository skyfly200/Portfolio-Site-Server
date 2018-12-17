var express = require('express');
var router = express.Router();
var tag = require('./tagLib');

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = Datastore();

// Post Functions and Routing
async function savePost(req) {
	// Create a new post record to be stored in the database
	const post_obj = {
		id: req.body.id,
		created: req.body.created,
		edited: req.body.edited,
    title: req.body.title,
    body: req.body.body,
    tags: req.body.tags,
		edits: req.body.edits,
		published: req.body.published,
		publishedVersion: req.body.publishedVersion,
		canComment: req.body.canComment,
		comments: req.body.comments,
		archived: req.body.archived
	};
  let result = await datastore.save({
		key: datastore.key(['post', post_obj.id]),
		data: post_obj,
	});
	return result;
}

function deletePost (id) {
	return new Promise( function(resolve, reject) {
		const key = datastore.key(['post', id]);
		getPost(id)
			.then((item) => {
				var tags = item.tags;
				datastore.delete(key, (err, response) => {
					if (err) reject(false);
					else {
						// decrement all post tags
						for (var t in tags) {
							tag.saveTag(tags[t].title, false);
						}
						resolve(response);
					}
				});
			});
	});
}

async function getPost (id) {
	const query = datastore.createQuery('post').filter('id', id);
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities[0];
  else return null;
}

async function getPosts () {
	const query = datastore.createQuery('post').order('created', { descending: true });
	let results = await datastore.runQuery(query);
  const entities = results[0];
  if (entities) return entities;
  else return null;
}

function randomString (length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function uid (callback) {
	var id = randomString(7);
	console.log(id);
	getPost(id)
	.then((post) => {
		if (!post) callback(id);
		else uid(callback);
  })
	.catch( (error) => {
		console.error(error);
	});
}

router.get('/uid', (req, res, next) => {
	try {
		uid((id) => {
	    res.status(200).json({id});
	    next();
	  });
	} catch(error)  {
		res.status(500).json(error);
		console.error(error);
		next();
	}
});

router.get('/', (req, res, next) => {
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

router.get('/post/:id', (req, res, next) => {
	if (req.params.id) {
		getPost(req.params.id)
		.then((post) => {
      res.status(200).json({post});
      next();
    })
		.catch( (error) => {
			res.status(204).json(error);
			console.error(error);
			next();
		});
	}
});

router.delete('/post/:id', (req, res, next) => {
	deletePost(req.params.id)
	.then((result) => {
    res.status(200).json({result: result, id: req.params.id});
    next();
  })
	.catch( (error) => {
		res.status(204).json({error: error});
		console.error(error);
		next();
	});
});

router.post('/submit', (req, res, next) => {
	savePost(req)
	.then( (entry) => {
		res.status(200).json(entry);
  	next();
	})
	.catch( (error) => {
		res.status(204).json(error);
		console.error(error);
		next();
	});
});

module.exports = router;
