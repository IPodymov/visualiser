import { env } from './config/env';
import { createApp } from './app';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Backend API is running on http://localhost:${env.PORT}`);
  console.log(`Swagger docs: http://localhost:${env.PORT}/api/docs`);
});
