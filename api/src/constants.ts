import dotenv from 'dotenv';

dotenv.config();

// Application configuration
export const CONFIG = {
  PORT: parseInt(process.env.PORT || '8000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || '',
} as const;

// Validation for required environment variables
const validateEnvironmentVariables = (): void => {
  const requiredVars = [
    { name: 'SUPABASE_URL', value: CONFIG.SUPABASE_URL },
    { name: 'SUPABASE_SERVICE_KEY', value: CONFIG.SUPABASE_SERVICE_KEY },
    { name: 'SUPABASE_JWT_SECRET', value: CONFIG.SUPABASE_JWT_SECRET },
  ];

  const missingVars = requiredVars.filter(({ value }) => !value);

  if (missingVars.length > 0) {
    const missingVarNames = missingVars.map(({ name }) => name).join(', ');
    throw new Error(`Missing required environment variables: ${missingVarNames}`);
  }
};

// Validate environment variables on module load
validateEnvironmentVariables();

export default CONFIG; 