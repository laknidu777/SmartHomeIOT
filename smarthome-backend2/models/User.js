import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING },
    fullName: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING, allowNull: false },
  });
