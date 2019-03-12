const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/profrate', {
	useNewUrlParser: true,
});
mongoose.set('useCreateIndex', true);
mongoose.Promise = global.Promise;

var CourseSchema = new mongoose.Schema({
	cid: {type: String, required: true, unique: true},
	credit: {type: Number, min: 1},
	category: {type: String, enum: ['UE', 'PE', 'UC', 'PC']}
})
var Course = new mongoose.model('Course', CourseSchema);

var ProfSchema = new mongoose.Schema({
	name: {type: String, required: true},
	school: {type: String, required: true},
	courses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}],
	score: {
		overall: {type: Number, required: true},
		difficulty: {type: Number, required: true},
	}
})
var Prof = new mongoose.model('Prof', ProfSchema);

// see mongoose populate. 
// https://mongoosejs.com/docs/populate.html

var RatingSchema = new mongoose.Schema({
	prof: {type: mongoose.Schema.Types.ObjectId, ref: 'Prof'},
	course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
	score: {
		overall: {type: Number, required: true},
		difficulty: {type: Number, required: true},
	},
	date: {type: Date, default: Date.now},
	comment: String,
})
var Rating = new mongoose.model('Rating', RatingSchema);

// adding exports

exports.Course = Course;
exports.Prof = Prof;
exports.Rating = Rating;
exports.mongoose = mongoose;

/*
mongoose.connection.once('open', async () => {
	let course = await Course.findOne()
	let prof = await Prof.findOne()
	let rating = new Rating({
		prof: prof._id,
		course: course._id,
		score: {
			overall: 2.3,
			difficulty: 3.2
		},
		comment: 'This is test comment'
	})
	rating.save()
	.then(() => {
		mongoose.connection.close();
	})
	.catch(() => {
		mongoose.connection.close();
	})
})*/