import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('UserHomeDevice', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
  }, { timestamps: false });
