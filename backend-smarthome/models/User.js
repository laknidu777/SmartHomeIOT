// models/User.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    passwordHash: DataTypes.STRING,
  });
  User.associate = (models) => {
    //User.hasMany(models.Home, { foreignKey: 'ownerId' });
    User.belongsToMany(models.Home, {
      through: models.UserHome,
      foreignKey: 'userId',
    });
    User.belongsToMany(models.Room, {
      through: models.UserRoom,
      foreignKey: 'userId',
    });
    User.hasMany(models.UserHome, { foreignKey: 'userId' }); // ✅ Add this

  };

  return User;
};