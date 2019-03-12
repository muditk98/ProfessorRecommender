const express = require('express');
const request = require('request');
let models = require('./models');

let app = express();
app.use(express.urlencoded({
	extended: true
}));
app.use(express.json());
app.use(express.static('./public'));
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
		_id: req.params.professor_id
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
					// res.send(ratings)
					res.render('profile', {
						prof: prof,
						ratings: ratings
					})
				}
			})

		// res.render('professor');
	}
})

app.post('/professor/:professor_id', (req, res) => {
	if (req.body.captcha === undefine ||
		req.body.captcha === null ||
		req.body.captcha === '') {
		return res.json({"success": false, "msg": "Please select captcha"})
	}
	const secret_key = '';
	const verify_url = `https://google.com/recaptcha/api/siteverify?secret=${secret_key}&` + 
						`response=${req.body.captcha}&` + 
						`remote=${req.connection.remoteAddress}`;
	request(verify_url, (err, res, body) => {
		body = JSON.parse(body);
		console.log(body);
		if (body.success !== undefined && !body.success) {
			return res.json({"success": false, "msg": "Failed captcha verification"})			
		}

		let rating = new Rating({
			prof: models.mongoose.Schema.Types.ObjectId(req.params.professor_id),
			course: models.mongoose.Schema.Types.ObjectId(req.body.course),
			score: {
				overall: req.body.overall,
				difficulty: req.body.difficulty
			},
			comment: req.body.comment
		})
		rating.save()
		.then(() => {
			res.send('Success')
		})
		.catch(() => {
			res.send('Failed to add rating')
		})
		// return res.json({"success": true, "msg": "Captcha passed"})
	})
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