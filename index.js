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

app.get('/login', (req, res) => {
	res.render('login');
})
app.post('/products', (req, res) => {
	// form that allows us to add product.
	res.send();
})

app.get('/faculty', (req, res) => {
	res.render('faculty');
})
app.get('/faculty/:faculty_id', (req, res) => {
	res.render('faculty');
})
app.get('/course', (req, res) => {
	res.render('sensors');
})

app.locals.db.once('open', () => {
	app.listen(3000);
})