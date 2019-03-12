const express = require('express');
const request = require('request');

var Recaptcha = require('express-recaptcha').Recaptcha;
//import Recaptcha from 'express-recaptcha'
var recaptcha = new Recaptcha('6LeCDZcUAAAAAKZZ1P4YO0o_G2Ag-QTgi1pzti4w', '6LeCDZcUAAAAAH9F2KGnGLesk0Z5ppxNUlJ_C8CD');

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
app.get('/professor/:professor_id', recaptcha.middleware.render, async (req, res) => {
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

app.post('/professor/:professor_id', recaptcha.middleware.verify, (req, res) => {
	
	console.log(req.body);
	
	if (!req.recaptcha.error) {
		let rating = new models.Rating({
			prof: req.params.professor_id,
			course: req.body.course,
			overall: req.body.overall,
			difficulty: req.body.difficulty,
			comment: req.body.comment
		})
		console.log(rating);

		rating.save()
			.then(() => {
				res.render('professor', {
					message: 'Sucessfully rated'
				})
			})
			.catch(err => {
				res.render('professor', {
					message: 'Failure'
				})
			})
	} else {
		// error code
	}
	// return res.json({"success": true, "msg": "Captcha passed"})
})

if (module === require.main) {
	var PORT = process.env.PORT || 8080;
	app.locals.db.once('open', () => {
		app.listen(PORT, () => {
			console.log(`Server started on port: ${PORT}`);
		})
	})
}