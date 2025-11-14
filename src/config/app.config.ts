export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    type: 'sqlite';
    path: string;
  };
  recaptcha: {
    secretKey?: string;
  };
  frontend: {
    urls: string[];
  };
  cron: {
    timezone: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    type: 'sqlite',
    path: process.env.DATABASE_PATH || 'lawcast.db',
  },
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
  },
  frontend: {
    urls: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
      : ['http://localhost:5173'],
  },
  cron: {
    timezone: process.env.CRON_TIMEZONE || 'Asia/Seoul',
  },
});
