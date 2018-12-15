module.exports = {
  saveTag: async function(tag, increment) {
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
  },
  getTag: async function(tag) {
  	const id = tag.toLowercase();
  	const query = datastore.createQuery('tag').filter('id', id);
  	let result = await datastore.runQuery(query);
  	const entities = result[0];
    if (entities) return entities[0];
    else return null;
  },
  getTags: async function() {
  	const query = datastore.createQuery('tag');
  	let result = await datastore.runQuery(query);
  	const entities = result[0];
    if (entities) return entities;
    else return null;
  }
}
