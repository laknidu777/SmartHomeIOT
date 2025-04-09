const { firestore } = require("../fireBaseAdmin");

// POST /api/homes
exports.createHome = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.uid;

  try {
    if (!name) return res.status(400).json({ error: "Home name is required" });

    const newHomeRef = firestore.collection("users").doc(userId).collection("homes").doc();
    const homeData = {
      name,
      createdAt: new Date(),
    };

    await newHomeRef.set(homeData);

    return res.status(201).json({ message: "Home created", homeId: newHomeRef.id });
  } catch (error) {
    console.error("Error creating home:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

// GET /api/homes
exports.getHomes = async (req, res) => {
  const userId = req.user.uid;

  try {
    const snapshot = await firestore.collection("users").doc(userId).collection("homes").get();
    const homes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ homes });
  } catch (error) {
    console.error("Error fetching homes:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
