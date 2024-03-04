require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

(async function main() {
	const app = express();
	const PORT = process.env.PORT || 3000;

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(cors());
	app.use(express.static('public'));

	await mongoose
		.connect(process.env.MONGO_URI)
		.then(() => console.log('Connected to database'))
		.catch((err) => console.log(err));

	const userSchema = new mongoose.Schema({
		username: {
			type: String,
			unique: true,
			required: true,
		},
	});

	const exerciseSchema = new mongoose.Schema({
		description: {
			type: String,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
		date: {
			type: Date,
			default: Date.now,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	});

	const User = mongoose.model('User', userSchema);
	const Exercise = mongoose.model('Exercise', exerciseSchema);

	app.get('/', (req, res) => {
		res.sendFile(__dirname + '/views/index.html');
	});

	app.post('/api/users', async (req, res) => {
		try {
			const data = await User.create(req.body);
			res.status(201).json(data);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				error: err.message || 'Cannot create User',
			});
		}
	});

	app.get('/api/users', async (req, res) => {
		try {
			const data = await User.find();
			res.status(200).json(data);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				error: err.message || 'Cannot get Users',
			});
		}
	});

	app.post('/api/users/:userId/exercises', async (req, res) => {
		try {
			const { description, duration, date } = req.body;
			const { userId } = req.params;

			const user = await User.findById(userId);

			if (!user) {
				res.status(404).json({
					error: 'User not found!',
				});
			}

			const newExercise = new Exercise({
				description,
				duration,
				date,
				user: user._id,
			});

			await newExercise.save();

			res.status(201).json({
				username: user.username,
				description: newExercise.description,
				duration: newExercise.duration,
				date: new Date(newExercise.date).toDateString(),
				_id: user._id,
			});
		} catch (err) {
			console.error(err);

			res.status(500).json({
				error: err.message || 'Cannot create Exercise',
			});
		}
	});

	app.get('/api/users/:userId/logs', async (req, res) => {
		try {
			const { userId } = req.params;
			const {from, to, limit} = req.query;

			const user = await User.findById(userId);

			if (!user) {
				res.status(404).json({
					error: 'User not found!',
				});
			}

			let exercises = await Exercise.find({ user });

			if(from) {
				try {
					const fromDate = new Date(from);
					exercises = exercises.filter((exercise) => exercise.date >= fromDate);
				} catch(err) {
					console.log(err);
					res.status(500).json({
						error: err.message || 'Invalid date format'
					})
				}
			}

			if(to) {
				try {
					const toDate = new Date(to);
					exercises = exercises.filter((exercise) => exercise.date <= toDate);
				} catch(err) {
					console.log(err);
					res.status(500).json({
						error: err.message || 'Invalid date format'
					})
				}
			}

			if(limit && limit > 0) {
				exercises = exercises.slice(0, limit);
			}

			res.status(200).json({
				username: user.username,
				count: exercises.length,
				_id: user._id,
				log: exercises.map((exercise) => ({
					description: exercise.description,
					duration: exercise.duration,
					date: new Date(exercise.date).toDateString(),
				})),
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				error: err.message || 'Cannot get Logs',
			});
		}
	});

	app.listen(PORT, () => {
		console.log(`Your app is running on port http://[::1]:${PORT}`);
	});
})();
