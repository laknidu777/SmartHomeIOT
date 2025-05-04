export default (sequelize, DataTypes) => {
  const Device = sequelize.define("Device", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },    
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
    roomId: DataTypes.UUID,
    assignedHubId: {
      type: DataTypes.STRING, // Must match Hub.hubId (string PK)
      allowNull: true,
    },
    hubSsid: DataTypes.STRING,
    hubPassword: DataTypes.STRING,
  });

  Device.associate = (models) => {
    Device.belongsTo(models.Room, { foreignKey: 'roomId' });
    Device.hasMany(models.DeviceLog, { foreignKey: 'deviceId' });
    Device.belongsTo(models.Hub, { foreignKey: 'assignedHubId', targetKey: 'hubId' });
  };

  return Device;
};
