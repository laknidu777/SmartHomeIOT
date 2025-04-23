export default (sequelize, DataTypes) => {
  const Hub = sequelize.define("Hub", {
    hubId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ssid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return Hub;
};
