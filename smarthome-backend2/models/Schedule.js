import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('Schedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userHomeDeviceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM('on', 'off'),
      allowNull: false,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    repeat: {
      type: DataTypes.ENUM('once', 'daily', 'weekly'),
      defaultValue: 'once',
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastExecuted: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'Schedules',
    timestamps: true,
  });

 
