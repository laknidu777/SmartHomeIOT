import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('UserHome', {
    role: {
      type: DataTypes.ENUM('SuperAdmin', 'Admin', 'User'),
      allowNull: false,
    },
  });
