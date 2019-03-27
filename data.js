let models = require('./models')

let courses = [
	{
		cid:'ECM1002',
		credit:4,
		category:'PC'
	},
	{
		cid:'ECE2001',
		credit:3,
		category:'PE'
	},
	{
		cid:'CSE3004',
		credit:3,
		category:'PE'
	},
	{
		cid:'MGT1002',
		credit:2,
		category:'UE'
	},
	{
		cid:'MAT3002',
		credit:4,
		category:'UC'
	}
]

models.mongoose.connection.once('open', () => {
	models.mongoose.connection.db.dropDatabase()
	.then(result => {
		console.log(result);
		return models.Course.create(courses)
	})
	.then(courses => {
		let profs = [{
				name: 'Robin',
				school: 'SCSE',
				courses: [courses[0]._id, courses[4]._id, courses[1]._id],
				overall: 2,
				difficulty: 4
			},
			{
				name: 'Mathew',
				school: 'SENSE',
				courses: [courses[2]._id, courses[1]._id]
			},
			{
				name: 'John',
				school: 'SELECT',
				courses: [courses[1]._id, courses[2]._id, courses[3]._id]
			},
			{
				name: 'Brock',
				school: 'SCSE',
				courses: [courses[0]._id, courses[1]._id, courses[2]._id, courses[3]._id]
			},
			{
				name: 'Salvia',
				school: 'SENSE',
				courses: [courses[0]._id, courses[3]._id]
			}
		]
		return models.Prof.create(profs)
	})
	.then(profs => {
		let ratings = [
			{
				prof: profs[0]._id,
				course: courses[0]._id,
				overall: 2,
				difficulty: 5,
				sentiment: 0
			},
			{
				prof: profs[1]._id,
				course: courses[0]._id,
				overall: 5,
				difficulty: 2,
				sentiment: 0
			},
			{
				prof: profs[1]._id,
				course: courses[0]._id,
				overall: 1,
				difficulty: 1,
				sentiment: 0
			}
		]
		return models.Rating.create(ratings)
	})
	.then(ratings => {
		console.log('Done');
	})
	.catch(err => {
		console.log(err);
	})
	.then(() => {
		setTimeout(() => {
			models.mongoose.connection.close();
		}, 2);
	})
})