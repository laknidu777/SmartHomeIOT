import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('UserHomeRoom', {}, { timestamps: false });
