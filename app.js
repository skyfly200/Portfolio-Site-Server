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

// Post Functions
async function savePost(req) {
	// Create a new post record to be stored in the database
	const post = {
		id: req.body.id,
		created: req.body.created,
		edited: req.body.edited,
    title: req.body.title,
    body: req.body.body,
    tags: req.body.tags,
		edits: req.body.edits
	};
  let result = await datastore.save({
		key: datastore.key(['post', post.id]),
		data: post,
	});
	return result;
}

function deletePost (id) {
	return new Promise( function(resolve, reject) {
		const key = datastore.key(['post', id]);
		datastore.delete(key, (err, response) => {
			if (err) reject(false);
			else {
				// decrement all post tags
				resolve(response);
			}
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

async function getPostsByTag (tag) {
	const query = datastore.createQuery('post').filter('tags', '=', tag).order('created', { descending: true });
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

function uid () {
	var unique = false;
	while (!unique) {
		var id = randomString(7);
		getPost(id)
		.then((post) => {
			if (post === {}) unique = true;
			return id;
	  })
		.catch( (error) => {
			console.error(error);
		});
	}
}

app.get('/posts-nonce', (req, res, next) => {
	uid()
	.then((id) => {
    res.status(200).json({id});
    next();
  })
	.catch( (error) => {
		res.status(204).json(error);
		console.error(error);
		next();
	});
});

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

app.get('/posts/:tag', (req, res, next) => {
	if (req.params.tag) {
		getPostsByTag(req.params.tag)
		.then((posts) => {
      res.status(200).json({posts});
      next();
    })
		.catch( (error) => {
			res.status(204).json(error);
			console.error(error);
			next();
		});
	}
});

app.get('/post/:id', (req, res, next) => {
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

app.delete('/post/:id', (req, res, next) => {
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

app.post('/submit', (req, res, next) => {
	savePost(req)
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

// Tag Functions

async function getTags() {
	const query = datastore.createQuery('tag');
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities[0];
  else return null;
}

app.get('/tags', (req, res, next) => {
	getTags()
	.then((tags) => {
    res.status(200).json({tags});
    next();
  })
	.catch( (error) => {
		res.status(204).json(error);
		console.error(error);
		next();
	});
});

async function getTag(tag) {
	const id = tag.toLowercase();
	const query = datastore.createQuery('tag').filter('id', id);
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities[0];
  else return null;
}

app.get('/tags/:id', (req, res, next) => {
	if (req.params.id) {
		getTag(req.params.id)
		.then((tag) => {
	      res.status(200).json({tag});
	      next();
	    })
		.catch( (error) => {
			res.status(204).json(error);
			console.error(error);
			next();
		});
	}
});

async function saveTag(tag, increment) {
	const id = tag.toLowercase();
	const query = datastore.createQuery('tag').filter('id', id);
	let tag_obj = await datastore.runQuery(query);
	let updated = (tag_obj[0][0] !== undefined ? tag_obj[0][0] : {
		id: id,
		title: tag,
		count: 0,
		created: new Date()
	});
	// increment or decrement tag count
	updated.count += ( increment ? 1 : -1 );
	let result = await datastore.save({
		key: datastore.key(['tag', tag.id]),
		data: updated,
	});
	return result;
}

app.post('/tags', (req, res, next) => {
	saveTag(req.body.tag, req.body.increment)
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

// Auth Functions

function registerUser(req, res, next) {
	datastore.insert({
		key: datastore.key(['user', req.body.email]),
		data: {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			username: req.body.username,
			email: req.body.email,
			password: bcrypt.hashSync(req.body.password, 8),
			subscribe: req.body.subscribe,
			admin: 0
		}
	},
	(err) => {
		if (err) return res.status(500).send("There was a problem registering the user.")
		sendAuth(req, res, next);
	});
}

app.post('/register', registerUser);

function sendAuth(req, res, next) {
	getUser(req.body.email)
	.then( (user) => {
    if (!user) return res.status(404).send('No user found.');
    let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
    let token = jwt.sign({ id: user.id }, config.secret, { expiresIn: 86400 }); // Expires in 24 hours
    res.status(200).send({ auth: true, token: token, user: user });
		next();
  })
	.catch( (err) => {
		res.status(500).send("There was a problem getting user");
	});
}

async function getUser(email) {
	const query = datastore.createQuery('user').filter('email', email);
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities[0];
  else return null;
}

app.post('/login', sendAuth);

// Start Server

const PORT = process.env.PORT || 80;
app.listen(process.env.PORT || 80, () => {
	console.log(`App listening on port ${PORT}`);
	console.log('Press Ctrl+C to quit.');
});

// [END gae_flex_datastore_app]

module.exports = app;
