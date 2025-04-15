const { firestore } = require("../fireBaseAdmin");
const { v4: uuidv4 } = require("uuid");

// POST /api/items
exports.createItem = async (req, res) => {
  const { homeId, categoryId, name, espId, status = false } = req.body;
  const userId = req.user.uid;

  if (!homeId || !categoryId || !name || !espId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const espSecret = uuidv4(); // 🔐 Generate unique secret

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
      espSecret, // 🔐 Save generated UUID
      status,
      createdAt: new Date(),
      homeId,
    };

    await itemRef.set(itemData);

    res.status(201).json({
      message: "Item created",
      itemId: itemRef.id,
      espSecret, // Return to frontend to display to user
    });
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
// Get all devices for a home (across all categories)
// Get all devices for a home (across all categories)
exports.getAllItemsByHome = async (req, res) => {
  try {
    const { homeId } = req.query;
    const userId = req.user.uid;

    if (!homeId) {
      return res.status(400).json({ message: "Missing homeId" });
    }

    // First, verify the home exists for this user
    const homeRef = firestore
      .collection("users")
      .doc(userId)
      .collection("homes")
      .doc(homeId);

    const homeDoc = await homeRef.get();
    if (!homeDoc.exists) {
      return res.status(404).json({ message: "Home not found" });
    }

    // Get all categories for this home
    const categoriesSnapshot = await homeRef.collection("categories").get();
    
    // Use Promise.all to run all item queries in parallel
    const categoryPromises = categoriesSnapshot.docs.map(async (categoryDoc) => {
      const categoryId = categoryDoc.id;
      const itemsSnapshot = await homeRef
        .collection("categories")
        .doc(categoryId)
        .collection("items")
        .get();
      
      return itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        categoryId,
        categoryName: categoryDoc.data().name,
        ...doc.data()
      }));
    });
    
    // Wait for all category queries to complete
    const itemsByCategory = await Promise.all(categoryPromises);
    
    // Flatten the array of arrays into a single array of items
    const items = itemsByCategory.flat();

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching all items:", error);
    return res.status(500).json({ message: "Failed to fetch items", error: error.message });
  }
};