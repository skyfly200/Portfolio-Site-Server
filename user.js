
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
  return 0;
}

module.exports = {
  registerUser: registerUser,
  sendAuth: sendAuth,
  getUser: getUser
};
