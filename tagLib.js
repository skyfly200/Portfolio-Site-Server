// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = Datastore();

exports.saveTag = async function(tag, increment) {
	console.log(tag);
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

exports.getTag = async function(tag) {
	const id = tag.toLowercase();
	const query = datastore.createQuery('tag').filter('id', id);
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities[0];
  else return null;
}

exports.getTags = async function() {
	const query = datastore.createQuery('tag');
	let result = await datastore.runQuery(query);
	const entities = result[0];
  if (entities) return entities;
  else return null;
}
