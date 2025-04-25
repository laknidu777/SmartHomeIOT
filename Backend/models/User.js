export default (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      name: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
      },
    });
  
    User.associate = (models) => {
      // Define associations later
    };
  
    return User;
  };
  