const { firestore } = require("../fireBaseAdmin");

// POST /api/categories
exports.createCategory = async (req, res) => {
  const { homeId, name } = req.body;
  const userId = req.user.uid;

  if (!homeId || !name) {
    return res.status(400).json({ error: "homeId and category name are required" });
  }

  try {
    const categoryRef = firestore
      .collection("users")
      .doc(userId)
      .collection("homes")
      .doc(homeId)
      .collection("categories")
      .doc();

    const categoryData = {
      name,
      createdAt: new Date(),
    };

    await categoryRef.set(categoryData);

    res.status(201).json({
      message: "Category created",
      categoryId: categoryRef.id,
    });
  } catch (err) {
    console.error("❌ Error creating category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/categories?homeId=123
exports.getCategories = async (req, res) => {
  const { homeId } = req.query;
  const userId = req.user.uid;

  if (!homeId) return res.status(400).json({ error: "homeId is required" });

  try {
    const snapshot = await firestore
      .collection("users")
      .doc(userId)
      .collection("homes")
      .doc(homeId)
      .collection("categories")
      .get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ categories });
  } catch (err) {
    console.error("❌ Error getting categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
