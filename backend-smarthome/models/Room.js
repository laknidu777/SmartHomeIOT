export default (sequelize, DataTypes) => {
    const Room = sequelize.define('Room', {
      name: DataTypes.STRING,
      homeId: DataTypes.INTEGER,
    });
  
    Room.associate = (models) => {
      Room.belongsTo(models.Home, { foreignKey: 'homeId' });
      Room.hasMany(models.Device, { foreignKey: 'roomId' });
    };
  
    return Room;
  };
  