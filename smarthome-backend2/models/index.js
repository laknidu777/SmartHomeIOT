import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

// Import models
import UserModel from './User.js';
import HouseModel from './House.js';
import RoomModel from './Room.js';
import DeviceModel from './Device.js';
import HubModel from './Hub.js';
import UserHomeModel from './UserHome.js';
import UserHomeRoomModel from './UserHomeRoom.js';
import UserHomeDeviceModel from './UserHomeDevice.js';
import HubDeviceModel from './HubDevice.js';
import EmailVerificationCodeModel from './EmailVerificationCode.js';
import ScheduleModel from './Schedule.js';
import NoUserDeviceModel from './noUserDevice.js';


// Init models
const User = UserModel(sequelize);
const House = HouseModel(sequelize);
const Room = RoomModel(sequelize);
const Device = DeviceModel(sequelize);
const Hub = HubModel(sequelize);
const UserHome = UserHomeModel(sequelize);
const UserHomeRoom = UserHomeRoomModel(sequelize);
const UserHomeDevice = UserHomeDeviceModel(sequelize);
const HubDevice = HubDeviceModel(sequelize);
const EmailVerificationCode = EmailVerificationCodeModel(sequelize);
const Schedule = ScheduleModel(sequelize);
const NoUserDevice = NoUserDeviceModel(sequelize); 


// Associations

// User ↔ UserHome ↔ House
User.hasMany(UserHome);
UserHome.belongsTo(User);
House.hasMany(UserHome, {
  foreignKey: 'HouseId',
  onDelete: 'CASCADE',
});
UserHome.belongsTo(House);

// House ↔ Room
House.hasMany(Room, {
  foreignKey: 'HouseId',
  onDelete: 'CASCADE',
});
Room.belongsTo(House);


// House ↔ Hub
House.hasMany(Hub);
Hub.belongsTo(House);

// Room ↔ Devices (optional if needed)
Room.hasMany(Device, {
  foreignKey: 'RoomId',
  onDelete: 'CASCADE',
});
Device.belongsTo(Room, {
  foreignKey: 'RoomId',
  onDelete: 'CASCADE',
});

// UserHome ↔ Rooms (Many-to-Many)
UserHome.belongsToMany(Room, { through: UserHomeRoom, foreignKey: 'userHomeId' });
Room.belongsToMany(UserHome, { through: UserHomeRoom, foreignKey: 'roomId' });

UserHomeRoom.belongsTo(Room, { foreignKey: 'roomId' });
Room.hasMany(UserHomeRoom, { foreignKey: 'roomId' });


// UserHome ↔ Devices (Many-to-Many)
UserHome.belongsToMany(Device, { through: UserHomeDevice, foreignKey: 'userHomeId' });
Device.belongsToMany(UserHome, { through: UserHomeDevice, foreignKey: 'deviceId' });

UserHomeDevice.belongsTo(Device, { foreignKey: 'deviceId' });
Device.hasMany(UserHomeDevice, { foreignKey: 'deviceId' });

UserHomeDevice.belongsTo(UserHome, { foreignKey: 'userHomeId' });
UserHome.hasMany(UserHomeDevice, { foreignKey: 'userHomeId' });



// Hub ↔ Devices
Hub.hasMany(HubDevice, { foreignKey: 'hubId' });
Device.hasOne(HubDevice, { foreignKey: 'deviceId' });
HubDevice.belongsTo(Hub, { foreignKey: 'hubId' });
HubDevice.belongsTo(Device, { foreignKey: 'deviceId' });

//Schedule ↔ Devices
Schedule.belongsTo(UserHomeDevice, { foreignKey: 'userHomeDeviceId' });

export {
  sequelize,
  User,
  House,
  Room,
  Device,
  Hub,
  UserHome,
  UserHomeRoom,
  UserHomeDevice,
  HubDevice,
  EmailVerificationCode,
  Schedule,
  NoUserDevice,
};
