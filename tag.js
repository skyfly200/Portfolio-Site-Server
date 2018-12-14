// Tag Functions

async function getTags() {
	const query = datastore.createQuery('tag');
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities[0];
  return 0;
}

async function addTag(tag, post) {
	const query = datastore.createQuery('tag').filter('tag', tag);
	let tag_obj = await datastore.runQuery(query);
	let updated = (tag_obj[0][0] !== undefined ? tag_obj[0][0].push(post) : [post]);
	let result = await datastore.save({
		key: datastore.key(['tag', tag]),
		data: updated,
	});
	return result;
}

module.exports = {
  getTags: getTags,
  addtag: addTag
};
