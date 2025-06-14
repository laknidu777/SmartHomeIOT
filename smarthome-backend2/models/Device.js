import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('Device', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    espId: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    isOn: { type: DataTypes.BOOLEAN, defaultValue: false },         // for toggle state
    isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },     // for status updates
    assignedHubId: { type: DataTypes.STRING },                        // to route through hub
    hubSsid: { type: DataTypes.STRING },                            // for provisioning
    hubPassword: { type: DataTypes.STRING },   
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'light', // fallback if type is missing
    },
    pin: {
      type: DataTypes.STRING, // store hashed PIN
      allowNull: true,
    },                    // for provisioning
    RoomId: { type: DataTypes.INTEGER  },                               // already used in create/update
    homeId: { type: DataTypes.UUID },                               // for access control
  });
