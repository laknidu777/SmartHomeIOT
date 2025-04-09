const { firestore } = require("../fireBaseAdmin");

// POST /api/items
exports.createItem = async (req, res) => {
  const { homeId, categoryId, name, espId, status = false } = req.body;
  const userId = req.user.uid;

  if (!homeId || !categoryId || !name || !espId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const itemRef = firestore
      .collection("users")
      .doc(userId)
      .collection("homes")
      .doc(homeId)
      .collection("categories")
      .doc(categoryId)
      .collection("items")
      .doc();

    const itemData = {
      name,
      espId,
      status,
      createdAt: new Date(),
    };

    await itemRef.set(itemData);

    res.status(201).json({ message: "Item created", itemId: itemRef.id });
  } catch (err) {
    console.error("❌ Error creating item:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/items?homeId=...&categoryId=...
exports.getItems = async (req, res) => {
  const { homeId, categoryId } = req.query;
  const userId = req.user.uid;

  if (!homeId || !categoryId) {
    return res.status(400).json({ error: "homeId and categoryId required" });
  }

  try {
    const snapshot = await firestore
      .collection("users")
      .doc(userId)
      .collection("homes")
      .doc(homeId)
      .collection("categories")
      .doc(categoryId)
      .collection("items")
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ items });
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
