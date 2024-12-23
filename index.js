require('dotenv').config('./.env');
const express = require('express');
const db = require('./config/db')
const createTable = require('./Tables/UserTables');
const path = require('path');
const app = express();
const cors = require('cors');

const UserRouter = require('./routes/UserRoutes');



const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const http = require('http');

const server = http.createServer(app);

app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/user', UserRouter);




// app.use(notFound);
// app.use(errorHandler);

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
