// Replace 192.168.1.XXX with YOUR actual IP from Step 1
const ENV = {
  development: {
    API_URL: 'http://192.168.29.69:5000/api', // ← Change XXX to your IP
    IMAGE_BASE_URL: 'http://192.168.29.69:5000',
    DEBUG: true,
  },
  staging: {
    API_URL: 'https://staging-api.tijara.com/api',
    IMAGE_BASE_URL: 'https://staging-api.tijara.com',
    DEBUG: true,
  },
  production: {
    API_URL: 'https://api.tijara.com/api',
    IMAGE_BASE_URL: 'https://api.tijara.com',
    DEBUG: false,
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.development;
  }
  return ENV.production;
};

export default getEnvVars();