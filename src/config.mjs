export default {
  development: {
    type: 'development',
    port: 3000,
    mongodb: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mysocialnetwork',
  },
  production: {
    type: 'production',
    port: 3000,
    mongodb: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mysocialnetwork',
  },
};
