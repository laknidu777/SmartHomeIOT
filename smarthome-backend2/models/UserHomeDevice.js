import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('UserHomeDevice', {}, { timestamps: false });
