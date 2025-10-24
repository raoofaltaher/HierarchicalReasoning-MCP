// Intentionally simple fixture for Express framework detection
// This file demonstrates Express.js patterns for testing

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/api/users', async (req, res) => {
  // Mock user data for testing
  const users = [{ id: 1, name: 'Test User' }];
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  // Mock user creation for testing
  const user = { id: 2, ...req.body };
  res.json(user);
});

module.exports = app;

export default app;
