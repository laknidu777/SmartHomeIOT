import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('HubDevice', {
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  });
