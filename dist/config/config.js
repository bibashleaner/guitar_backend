import dotenv from 'dotenv';
dotenv.config();
// loads your environment variables from a .env file and provides type checking.
const config = {
    port: Number(process.env.PORT) || 3000,
    mongo_uri: process.env.MONGO_URI || 'development',
    mongo_database: process.env.MONGO_DATABASE || 'development'
};
export default config;
