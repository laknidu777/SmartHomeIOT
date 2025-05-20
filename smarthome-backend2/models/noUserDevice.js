import { DataTypes } from 'sequelize';

export default (sequelize) => sequelize.define('NoUserDevice', {
  espId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  connectedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  type: {
  type: DataTypes.STRING,
  allowNull: false,
  //defaultValue: 'light',
},

});

// export default NoUserDevice;
