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
      assignedHubId: {
        type: DataTypes.STRING, // or INTEGER if you have a Hub table
        allowNull: true,
      },
      hubSsid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hubPassword: {
        type: DataTypes.STRING,
        allowNull: true,
      },
          
    });
  
    Device.associate = (models) => {
      Device.belongsTo(models.Room, { foreignKey: 'roomId' });
      Device.hasMany(models.DeviceLog, { foreignKey: 'deviceId' });
      Device.belongsTo(models.Hub, { foreignKey: 'assignedHubId' });
    };
  
    return Device;
  };
  