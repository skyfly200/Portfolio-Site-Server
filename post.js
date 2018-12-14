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
			else resolve(response);
		});
	});
}

async function getPost (id) {
	const query = datastore.createQuery('post').filter('id', id);
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities[0];
  return 0;
}

async function getPosts () {
	const query = datastore.createQuery('post').order('created', { descending: true });
	let results = await datastore.runQuery(query);
  const entities = results[0];
  if (entities) return entities;
  return 0;
}

async function getPostsByTag (tag) {
	const query = datastore.createQuery('post').filter('tags', '=', tag).order('created', { descending: true });
	let results = await datastore.runQuery(query);
  const entities = results[0];
  if (entities) return entities;
  return 0;
}

module.exports = {
  savePost: savePost,
  deletePost: deletePost,
  getPost: getPost,
  getPosts: getPosts,
  getPostsByTag: getPostsByTag
};
