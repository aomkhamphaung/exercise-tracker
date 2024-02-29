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
		userId: {
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
			const newUser = await User.create(req.body);
			res.status(201).json({ data: newUser });
		} catch (err) {
			console.error(err);
			res.status(500).json({
				error: err.message || 'Cannot create User',
			});
		}
	});

	app.get('/api/users', async (req, res) => {
		try {
			const users = await User.find();
			res.status(200).json({ data: users });
		} catch (err) {
			console.error(err);
			res.status(500).json({
				error: err.message || 'Cannot get Users',
			});
		}
	});

	app.post('/api/users/:id/exercises', async (req, res) => {
		try {
			const { description, duration, date } = req.body;
			const { id } = req.params;

			const user = await User.findById(id);

			if (!user) {
				res.status(404).json('User not found!');
			}

			const newExercise = new Exercise({
				description,
				duration,
				date,
				userId: user._id,
			});

			const exercise = await newExercise
				.save()
				.then((exercise) => exercise.populate('userId'));

			res.status(201).json({ data: exercise });
		} catch (err) {
			console.error(err);

			res.status(500).json({
				error: err.message || 'Cannot create Exercise',
			});
		}
	});

	app.get('/api/users/:id/logs', async (req, res) => {
		try {
			res.status(200).json({ message: 'Hello World' });
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
