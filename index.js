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

app.get('/', (req, res) => {
	res.render('home');
})

// app.get('/login', (req, res) => {
// 	res.render('login');
// })

app.get('/faculty', (req, res) => {
	res.render('faculty');
})
app.get('/faculty/:faculty_id', (req, res) => {
	res.render('faculty');
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