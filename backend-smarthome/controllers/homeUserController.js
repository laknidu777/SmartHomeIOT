import db from '../models/index.js';
const { User, Home, HomeUsers } = db;

export const assignUserToHome = async (req, res) => {
  try {
    const { homeId } = req.params;
    const { userId, role } = req.body;

    // Validate that home and user exist
    const home = await Home.findByPk(homeId);
    if (!home) return res.status(404).json({ error: 'Home not found' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create or update the assignment
    const [assignment, created] = await HomeUsers.findOrCreate({
      where: { userId, homeId },
      defaults: { role },
    });

    if (!created && role) {
      assignment.role = role;
      await assignment.save();
    }

    return res.status(200).json({
      message: 'User assigned to home successfully',
      data: assignment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsersByHome = async (req, res) => {
  try {
    const { homeId } = req.params;
    
    // Alternative approach: Get users through the join table directly
    const homeUsers = await HomeUsers.findAll({
      where: { homeId },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!homeUsers.length) {
      // Check if home exists at all
      const homeExists = await Home.findByPk(homeId);
      if (!homeExists) {
        return res.status(404).json({ error: 'Home not found' });
      }
    }

    // Transform data to match expected format
    const users = homeUsers.map(hu => {
      const user = hu.User.toJSON();
      user.HomeUsers = { role: hu.role };
      return user;
    });

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unassignUserFromHome = async (req, res) => {
  try {
    const { homeId, userId } = req.params;

    const removed = await HomeUsers.destroy({
      where: { userId, homeId },
    });

    if (!removed)
      return res.status(404).json({ error: 'Assignment not found' });

    return res.status(200).json({ message: 'User unassigned from home' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};