export default (sequelize, DataTypes) => {
    const Home = sequelize.define('Home', {
      name: DataTypes.STRING,
      address: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    });
  
    Home.associate = (models) => {
      Home.belongsTo(models.User, { foreignKey: 'userId' });
      Home.hasMany(models.Room, { foreignKey: 'homeId' });
    };
  
    return Home;
  };
  