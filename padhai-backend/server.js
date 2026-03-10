const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // MUST be before any require that reads process.env

const notesRouter = require('./src/routes/notes');
const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));

app.use('/api/notes', notesRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`PadhAI backend listening on ${port}`));
