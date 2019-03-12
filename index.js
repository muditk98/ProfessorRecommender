const express = require('express');
let models = require('./models');
let app = express();
app.use(express.urlencoded({
	extended: true
}));
app.use(express.json());
app.use(express.static('./css'));
app.set('views', './views');
app.set('view engine', 'pug');

app.locals.db = models.mongoose.connection;
app.locals.db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// app.get('/login', (req, res) => {
// 	res.render('login');
// })

app.get(['/', '/professor'], (req, res) => {
	res.render('professor');
})
app.post('/professor', async (req, res) => {
	query = {}
	if (req.body.course) {
		let courses = await models.Course.find(
			{
				cid: {
					'$regex': req.body.course || '',
					'$options': 'i'
				}
			},
			{_id: 1}
		)
		query.courses = {'$in': courses.map(course => {return course._id})}
	}
	query.name = {
		'$regex': req.body.name || '',
		'$options': 'i'
	}
	query.school = {
		'$regex': req.body.school || '',
		'$options': 'i'
	}
	models.Prof.find(query)
		.populate('courses')
		.exec((err, profs) => {
			if (err) {
				console.error(err);
				res.send('Server encountered an error')
			} else {
				profs = profs.map(prof => {
					prof.link = '/professor/' + prof._id;
					return prof;
				})
				res.render('link', {
					profs: profs
				});
			}
		});
})
app.get('/professor/:professor_id', async (req, res) => {
	let prof = await models.Prof.findOne({
		_id: models.mongoose.Schema.Types.ObjectId(req.params.professor_id)
	})
	if (!prof) {
		res.send('Coud not find professor with this Id')
	} else {
		models.Rating.find({prof: prof._id})
			.populate('course')
			.exec((err, ratings) => {
				if (err) {
					console.error(err);
					res.send('Server encountered an error')
				} else {
					res.send(ratings)
				}
			})

		res.render('professor');
	}
})
// app.get('/course', (req, res) => {
// 	res.render('sensors');
// })


if (module === require.main) {
	var PORT = process.env.PORT || 8080;
	app.locals.db.once('open', () => {
		app.listen(PORT, () => {
			console.log(`Server started on port: ${PORT}`);
		})
	})
}