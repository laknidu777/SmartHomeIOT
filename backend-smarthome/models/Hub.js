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
      homeId: {
        type: DataTypes.UUID,
        allowNull: false,// change this TEMPORARILY
      },
    });

    Hub.associate = (models) => {
      Hub.belongsTo(models.Home, { foreignKey: 'homeId' });
      Hub.hasMany(models.Device, { foreignKey: 'assignedHubId' });
    };

    return Hub;
  };
