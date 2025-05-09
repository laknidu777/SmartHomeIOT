import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('Room', {
    name: { type: DataTypes.STRING, allowNull: false },
  });
