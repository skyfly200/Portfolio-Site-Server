var express = require('express');
var router = express.Router();
var tag = require('./tagLib');

// Tag Functions and Routing
router.get('/', (req, res, next) => {
	tag.getTags()
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

router.get('/:id', (req, res, next) => {
	if (req.params.id) {
		tag.getTag(req.params.id)
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

router.post('/', (req, res, next) => {
	tag.saveTag(req.body.tag, req.body.increment)
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
