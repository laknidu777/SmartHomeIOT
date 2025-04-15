export default (sequelize, DataTypes) => {
    const Device = sequelize.define('Device', {
      name: DataTypes.STRING,
      type: DataTypes.STRING,
      espId: {
        type: DataTypes.STRING,
        unique: true,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isOn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      roomId: DataTypes.INTEGER,
    });
  
    Device.associate = (models) => {
      Device.belongsTo(models.Room, { foreignKey: 'roomId' });
      Device.hasMany(models.DeviceLog, { foreignKey: 'deviceId' });
    };
  
    return Device;
  };
  