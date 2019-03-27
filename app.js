const express = require('express');
const request = require('request');
const config = require('./config.json')
var Recaptcha = require('express-recaptcha').Recaptcha;
//import Recaptcha from 'express-recaptcha'
console.log(config);

var recaptcha = new Recaptcha(config.SITE_KEY, config.SECRET_KEY);

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

app.get('/', (req, res) => {
	res.render('home');
})
app.get('/professors', async (req, res) => {
	query = {}
	if (req.query.course) {
		let courses = await models.Course.find(
			{
				cid: { // select all courses that match given course query
					'$regex': req.query.course || '',
					'$options': 'i'
				}
			},
			{_id: 1} // only return _id
		)
		query.courses = {'$in': courses.map(course => course._id)}
	}
	query.name = {
		'$regex': req.query.name || '',
		'$options': 'i'
	}
	query.school = {
		'$regex': req.query.school || '',
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
					prof.link = '/professors/' + prof._id;
					return prof;
				})
				res.render('link', {
					profs: profs
				});
			}
		});
})



app.get('/professors/:professor_id', recaptcha.middleware.render, async (req, res) => {
	models.Prof.findOne({
		_id: req.params.professor_id
	}).populate('courses')
	.then(prof => {
		if (!prof) {
			res.send('Coud not find professor with this Id')
		} else {
			models.Rating.find({
					prof: prof._id
				})
				.sort({'date': 'desc'})
				.populate('course')
				.exec((err, ratings) => {
					if (err) {
						console.error(err);
						res.send('Server encountered an error')
					} else {
						// res.send(ratings)
						// console.log(res);
						res.render('output', {
							captcha: res.recaptcha,
							prof: prof,
							ratings: ratings
						})
					}
				})

			// res.render('professor');
		}
	})
	.catch(err => {
		res.send('Server encountered an error')
	})
})

app.post('/professors/:professor_id', recaptcha.middleware.verify, (req, res) => {
	
	console.log(req.body);
	
	if (!req.recaptcha.error) {
		let rating = new models.Rating({
			prof: req.params.professor_id,
			course: req.body.course,
			overall: req.body.overall || 0,
			difficulty: req.body.difficulty || 0,
			comment: req.body.comment
		})
		console.log(rating);

		rating.save()
			.then(() => {
				res.render('home', {
					message: 'Sucessfully rated'
				})
			})
			.catch(err => {
				res.render('home', {
					message: 'Failure'
				})
			})
	} else {
		// error code
		res.render('home', {
			message: 'Rating not posted as captcha was not verified'
		})
	}
	// return res.json({"success": true, "msg": "Captcha passed"})
})

app.get('/addProfessor', (req, res) => {
	res.render('addprof');
})

app.post('/professors', (req, res) => {
	if (!req.body.name || !req.body.school) {
		res.status(400).send('Form name and school cannot be empty')
		return;
	}
	let prof = {
		name: req.body.name,
		school: req.body.school,
		courses: []
	}
	query_courses = []
	if (req.body.course1) {
		query_courses.push(req.body.course1)
	}
	if (req.body.course2) {
		query_courses.push(req.body.course2)
	}
	if (req.body.course3) {
		query_courses.push(req.body.course3)
	}
	console.log(query_courses);
	models.Course.find({
		cid: {'$in': query_courses}
	})
		.then(courses => {
			console.log(courses);
			prof.courses = courses.map(course => course._id)
			return new models.Prof(prof).save()
		})
		.then(prof => {
			res.redirect(`/professors/${prof._id}`)
		})
		.catch(err => {
			console.log(err);
			res.send('Whoops');
		})
})


if (module === require.main) {
	var PORT = process.env.PORT || 8080;
	app.locals.db.once('open', () => {
		app.listen(PORT, () => {
			console.log(`Server started on port: ${PORT}`);
		})
	})
}