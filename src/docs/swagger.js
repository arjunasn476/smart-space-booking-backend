// Wires up the hand-authored OpenAPI spec (openapi.json) to
// swagger-ui-express. A hand-authored spec was chosen over scanning
// JSDoc @openapi comments (swagger-jsdoc's usual approach) because it
// guarantees full, consistent coverage of all 50 endpoints without
// depending on every route file being annotated correctly — one
// source of truth, always in sync with what's actually implemented.
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');

module.exports = { swaggerUi, openapiSpec };
