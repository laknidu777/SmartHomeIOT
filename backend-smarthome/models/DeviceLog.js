export default (sequelize, DataTypes) => {
    const DeviceLog = sequelize.define('DeviceLog', {
      deviceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: DataTypes.STRING,
      triggeredBy: DataTypes.STRING, // "app", "emg", "automation", etc.
    });
  
    DeviceLog.associate = (models) => {
      DeviceLog.belongsTo(models.Device, { foreignKey: 'deviceId' });
    };
  
    return DeviceLog;
  };
  