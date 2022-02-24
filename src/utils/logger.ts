import logger from 'pino';

const log = logger({
  transport: {
    target: 'pino-pretty',
  },
  base: {
    pid: false,
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
});

export default log;
