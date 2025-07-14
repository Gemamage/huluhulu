import express from 'express';

const app = express();
const port = 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal server is running' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from minimal server' });
});

app.listen(port, () => {
  console.log(`Minimal server running on http://localhost:${port}`);
});

console.log('Starting minimal server...');