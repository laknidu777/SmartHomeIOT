// models/UserHome.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserHome = sequelize.define('UserHome', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: DataTypes.UUID,
    homeId: DataTypes.UUID,
  });
  UserHome.associate = (models) => {
    UserHome.belongsTo(models.User, { foreignKey: 'userId' });
    UserHome.belongsTo(models.Home, { foreignKey: 'homeId' });
  };
  
  return UserHome;
};