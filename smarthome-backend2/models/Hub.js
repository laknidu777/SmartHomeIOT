import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('Hub', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    espId: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    ssid: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING },
    isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastSeen: DataTypes.DATE,
  });
