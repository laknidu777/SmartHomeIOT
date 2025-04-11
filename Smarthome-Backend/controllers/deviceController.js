const { firestore } = require("../fireBaseAdmin");

exports.getDeviceStatus = async (req, res) => {
  const { espId } = req.params;

  try {
    const usersSnapshot = await firestore.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const homesSnapshot = await firestore.collection("users").doc(userId).collection("homes").get();

      for (const homeDoc of homesSnapshot.docs) {
        const homeId = homeDoc.id;
        const categoriesSnapshot = await firestore
          .collection("users")
          .doc(userId)
          .collection("homes")
          .doc(homeId)
          .collection("categories")
          .get();

        for (const categoryDoc of categoriesSnapshot.docs) {
          const itemsSnapshot = await firestore
            .collection("users")
            .doc(userId)
            .collection("homes")
            .doc(homeId)
            .collection("categories")
            .doc(categoryDoc.id)
            .collection("items")
            .get();

          for (const itemDoc of itemsSnapshot.docs) {
            const itemData = itemDoc.data();
            if (itemData.espId === espId) {
              return res.status(200).json({ status: itemData.status });
            }
          }
        }
      }
    }

    return res.status(404).json({ message: "Device not found" });
  } catch (error) {
    console.error("Error fetching device status:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// exports.getDeviceStatus = async (req, res) => {
//   const { espId } = req.params;

//   try {
//     // Search across all users and homes (for simplicity)
//     const snapshot = await db.collectionGroup("items")
//       .where("espId", "==", espId)
//       .limit(1)
//       .get();

//     if (snapshot.empty) {
//       return res.status(404).json({ message: "Device not found" });
//     }

//     const device = snapshot.docs[0].data();
//     return res.status(200).json({ status: device.status });
//   } catch (error) {
//     console.error("Error fetching device status:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };
