import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    homeId: DataTypes.UUID,
  });

  Room.associate = (models) => {
    Room.belongsTo(models.Home, { foreignKey: 'homeId' });
    Room.hasMany(models.Device, { foreignKey: 'roomId' });
    Room.belongsToMany(models.User, {
      through: models.UserRoom,
      foreignKey: 'roomId',
    });
    
  };

  return Room;
};