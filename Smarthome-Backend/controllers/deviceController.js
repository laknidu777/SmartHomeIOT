const { firestore } = require("../fireBaseAdmin");

// POST /api/devices/pair
exports.pairDevice = async (req, res) => {
  const { espId, espSecret } = req.body;

  if (!espId || !espSecret) {
    return res.status(400).json({ message: "espId and espSecret required" });
  }

  try {
    const usersSnapshot = await firestore.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const homesSnapshot = await firestore
        .collection("users")
        .doc(userDoc.id)
        .collection("homes")
        .get();

      for (const homeDoc of homesSnapshot.docs) {
        const categoriesSnapshot = await firestore
          .collection("users")
          .doc(userDoc.id)
          .collection("homes")
          .doc(homeDoc.id)
          .collection("categories")
          .get();

        for (const categoryDoc of categoriesSnapshot.docs) {
          const itemsSnapshot = await firestore
            .collection("users")
            .doc(userDoc.id)
            .collection("homes")
            .doc(homeDoc.id)
            .collection("categories")
            .doc(categoryDoc.id)
            .collection("items")
            .where("espId", "==", espId)
            .limit(1)
            .get();

          if (!itemsSnapshot.empty) {
            const itemDoc = itemsSnapshot.docs[0];
            const itemData = itemDoc.data();

            if (itemData.espSecret !== espSecret) {
              return res.status(403).json({ message: "Invalid secret" });
            }

            // Update item with paired: true
            await itemDoc.ref.update({ paired: true });
            return res.status(200).json({ message: "✅ Device paired successfully" });
          }
        }
      }
    }

    return res.status(404).json({ message: "Device not found" });
  } catch (error) {
    console.error("❌ Error during pairing:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
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
exports.updateDeviceStatus = async (req, res) => {
    const { espId } = req.params;
    const { status } = req.body;
  
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
                // 🔥 Found the matching document, update it
                await itemDoc.ref.update({ status });
                return res.status(200).json({ message: "Device status updated" });
              }
            }
          }
        }
      }
  
      return res.status(404).json({ message: "Device not found" });
    } catch (error) {
      console.error("Error updating device:", error);
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
