const express = require('express');
// const request = require('request');
const config = require('./config.json')
const axios = require('axios')
var Recaptcha = require('express-recaptcha').Recaptcha;
//import Recaptcha from 'express-recaptcha'
console.log(config);
const NLP_URL = `https://language.googleapis.com/v1/documents:analyzeSentiment?fields=documentSentiment&key=${config.NLP_KEY}`
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

function hslToRgb(h, s, l) {
	var r, g, b;

	if (s == 0) {
		r = g = b = l; // achromatic
	} else {
		var hue2rgb = function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function numberToColorHsl(i) {
	// as the function expects a value between 0 and 1, and red = 0° and green = 120°
	// we convert the input to the appropriate hue value
	i = 100*(i+1)/2
	// console.log(i);
	var hue = i * 1.2 / 360;
	// we convert hsl to rgb (saturation 100%, lightness 50%)
	var rgb = hslToRgb(hue, 1, .5);
	// we format to css value and return
	return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + 0.5 +')';
}

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
							ratings: ratings,
							color: numberToColorHsl(prof.sentiment)
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
			comment: req.body.comment,
			sentiment: 0
		})
		if (req.body.comment) {
			axios.post(NLP_URL, 
				{
					document: {
						content: req.body.comment,
						type: 'PLAIN_TEXT'
					}
				})
				.then(nlp_response => {
					console.log(nlp_response.data);
					rating.sentiment = nlp_response.data.documentSentiment.score
					console.log(`rating.sentiment: ${rating.sentiment}`);
					
					return rating.save()
				})
				.catch(err => {
					console.log('Failed to nlp');
					console.log(err.message);
				})
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
		}
		console.log(rating);		
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