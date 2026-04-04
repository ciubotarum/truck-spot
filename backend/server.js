const app = require('./src/app');

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 TruckSpot Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
});
