let models = require('./models');

models.mongoose.connection.once('open', () => {
	let course = models.Course({
		cid: 'ECM1011',
		credit: 3,
		category: 'PE'
	})

})

let courses = [
	{
		cid: 'ECM2022',
		credit: 2,
		category: 'UE'
	},
	{
		
	}
]