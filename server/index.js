import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './utils/db.js';
import trackRoutes from './routes/track.js';
import submitRoutes from './routes/submit.js';
import campaignRoutes from './routes/campaigns.js';
import resultsRoutes from './routes/results.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const phishingPagesPath = path.join(__dirname, '..', 'phishing-pages');
const clientImagesPath = path.join(__dirname, '..', 'client', 'assets', 'images');
app.use('/pages', express.static(phishingPagesPath));
app.use('/media/images', express.static(clientImagesPath));

app.use(trackRoutes);
app.use(submitRoutes);
app.use(campaignRoutes);
app.use(resultsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PhishSim server running' });
});

async function start() {
  await getDb();
  console.log('📁 Database initialized');

  app.listen(PORT, () => {
    console.log(`🛡️  PhishSim server running at http://localhost:${PORT}`);
    console.log(`📄 Phishing pages served at http://localhost:${PORT}/pages/`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
