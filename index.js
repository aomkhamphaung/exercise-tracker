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
			required: true,
		},
	});

	const exerciseSchema = new mongoose.Schema({
		username: {
			type: String,
			required: true,
		},
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
			console.log(err);
			res.status(500).json('Cannot create user');
		}
	});

	app.get('/api/users', async (req, res) => {
		try {
			const users = await User.find();
			res.status(200).json({ data: users });
		} catch (err) {
			console.log(err);
			res.status(500).json('Cannot get users');
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

			const exercise = new Exercise({
				username: user.username,
				description,
				duration,
				date: date ? new Date(date) : new Date(),
			});

			await exercise.save();
			res.status(201).json({ data: exercise });
		} catch (err) {
			console.log(err);
			res.status(500).json('Cannot create Exercise');
		}
	});

	app.listen(PORT, () => {
		console.log(`Your app is listening on port http://[::1]:${PORT}`);
	});
})();
