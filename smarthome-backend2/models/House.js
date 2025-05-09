import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('House', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING },
  });
