// models/UserRoom.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserRoom = sequelize.define('UserRoom', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    roomId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  UserRoom.associate = (models) => {
    UserRoom.belongsTo(models.User, { foreignKey: 'userId' });
    UserRoom.belongsTo(models.Room, { foreignKey: 'roomId' });
  };

  return UserRoom;
};
