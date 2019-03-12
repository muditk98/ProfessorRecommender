const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/prof_rate', {
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
	overall: {type: Number, default: 0, min: 0, max: 5},
	difficulty: {type: Number, default: 0, min: 0, max: 5},
})
var Prof = new mongoose.model('Prof', ProfSchema);

// see mongoose populate. 
// https://mongoosejs.com/docs/populate.html

var RatingSchema = new mongoose.Schema({
	prof: {type: mongoose.Schema.Types.ObjectId, ref: 'Prof'},
	course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
	overall: {type: Number, required: true, min: 0, max: 5},
	difficulty: {type: Number, required: true, min: 0, max: 5},
	date: {type: Date, default: Date.now},
	comment: String,
})

async function calcAverage(rating) {
	Rating.aggregate([
		{
			'$match': {prof: rating.prof},
		},
		{
			'$group': {
				_id: null,
				avg_overall: {'$avg': '$overall'},
				avg_difficulty: {'$avg': '$difficulty'}
			}
		}
	])
	.exec()
	.then(data => {
		console.log(data);
		Prof.updateOne({_id: rating.prof}, {'$set': {
			overall: data[0].avg_overall,
			difficulty: data[0].avg_difficulty
		}})
		.exec()
	})
	.catch(err => {
		console.log(err);
	})
}

RatingSchema.post('save', calcAverage);
RatingSchema.post('delete', calcAverage);
RatingSchema.post('update', calcAverage);

var Rating = new mongoose.model('Rating', RatingSchema);

// adding exports

exports.Course = Course;
exports.Prof = Prof;
exports.Rating = Rating;
exports.mongoose = mongoose;



/*mongoose.connection.once('open', async () => {
	let course = await Course.findOne()
	let prof = await Prof.findOne()
	calcAverage({prof: prof._id})
	// let rating = new Rating({
	// 	prof: prof._id,
	// 	course: course._id,
	// 	score: {
	// 		overall: 2.3,
	// 		difficulty: 3.2
	// 	},
	// 	comment: 'This is test comment'
	// })
	// rating.save()
	// .then(() => {
	// 	mongoose.connection.close();
	// })
	// .catch(() => {
	// 	mongoose.connection.close();
	// })
})*/