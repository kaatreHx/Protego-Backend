const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require("http");

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const orgServiceRoutes = require('./src/routes/orgServiceRoutes');
const userRoutes = require('./src/routes/userRoutes');
const orgRoutes = require('./src/routes/orgRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const sosRoutes = require('./src/routes/sosRoutes');   // ADD THIS

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// SOCKET.IO SETUP 🔥
const io = require("socket.io")(server, {
  cors: { origin: "*" }
});

// Initialize socket manager
const sosSocket = require("./src/sockets/sosSockets");
sosSocket.init(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/service', orgServiceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/booking', bookRoutes);
app.use('/api/sos', sosRoutes);   // ADD THIS

const PORT = process.env.PORT || 5000;

// IMPORTANT: server.listen (NOT app.listen)
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
