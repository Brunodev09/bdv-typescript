#!/usr/bin/env node

const path = require('path');
const { config } = require("dotenv");
const cors = require("cors");
const express = require("express");
const app = express();
config({ path: path.resolve(__dirname, ".env") });

const { PORT } = process.env;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'BdvEngine')));


app.get('/', async (req, res) => {
    return res.sendFile(path.join(__dirname + '/BdvEngine/index.html'));
});

app.listen(PORT || 3000, () => console.log(`Http running: PORT -> ${PORT || 'LOCAL - 3000'}`));
