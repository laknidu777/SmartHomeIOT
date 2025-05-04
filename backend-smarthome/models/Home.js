// models/Home.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Home = sequelize.define('Home', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    ownerId: DataTypes.UUID,
  });

  Home.associate = (models) => {
    Home.belongsTo(models.User, { foreignKey: 'ownerId' });
    Home.hasMany(models.Room, { foreignKey: 'homeId' });
    Home.belongsToMany(models.User, {
      through: models.UserHome,
      foreignKey: 'homeId',
    });
  };

  return Home;
};