// Express app assembly: global middleware, static file serving,
// Swagger UI, route mounting, and error handling (in that order).
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Prisma returns BigInt for every ID column (see schema.prisma). Native
// JSON.stringify() cannot serialize BigInt and throws — this is the
// standard workaround. IDs in this exam-scale dataset are always small
// enough to safely round-trip through JS's Number type.
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const { swaggerUi, openapiSpec } = require('./docs/swagger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded photos — matches Ketentuan Global
// §III.5 exactly: /uploads/spaces/<file>, /uploads/members/<file>,
// /uploads/general/<file>.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Interactive Swagger UI at /docs, raw OpenAPI JSON at /docs-json —
// matches the links the root endpoint (GET /) already advertises.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/docs-json', (req, res) => res.json(openapiSpec));

app.use(routes);

// notFound must come after all real routes; errorHandler must be last.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
