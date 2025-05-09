import { sequelize } from './models/index.js';

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Use `alter: true` for production
    console.log('✅ All models were synced successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to sync models:', error);
    process.exit(1);
  }
};

syncDatabase();
