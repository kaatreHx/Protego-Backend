const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const orgServiceRoutes = require('./src/routes/orgServiceRoutes');
const userRoutes = require('./src/routes/userRoutes');
const orgRoutes = require('./src/routes/orgRoutes');
const bookRoutes = require('./src/routes/bookRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/service', orgServiceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/booking', bookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));