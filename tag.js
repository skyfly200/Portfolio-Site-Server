var express = require('express')
var router = express.Router()

// Tag Functions and Routing
async function getTags() {
	const query = datastore.createQuery('tag');
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities;
  else return null;
}

router.get('/', (req, res, next) => {
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

router.get('/:id', (req, res, next) => {
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
	} else {
		res.status(204).json({});
	}
});

async function saveTag(tag, increment) {
	const id = tag.toLowerCase();
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
		key: datastore.key(['tag', id]),
		data: updated,
	});
	return result;
}

router.post('/', (req, res, next) => {
	saveTag(req.body.tag, req.body.increment)
	.then( (entry) => {
		if (entry[0]) res.status(200).json(entry[0]);
		else res.status(204).json(null);
  	next();
	})
	.catch( (error) => {
		res.status(204).json(error);
		console.log(error);
		next();
	});
});

module.exports = router;
