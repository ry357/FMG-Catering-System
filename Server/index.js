import 'dotenv/config';
import app from './app.js';
import { startMonthlyReportJob } from './jobs/monthlyReportJob.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startMonthlyReportJob({ enabled: process.env.DISABLE_AUTO_REPORTS !== 'true' });
});