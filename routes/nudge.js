const express = require("express");
const { ObjectId } = require("mongodb");
const upload = require("../upload");
const path = require("path");
const fs = require("fs").promises;

const router = express.Router();

router.get("/nudges", async (req, res) => {
  try {
    const { id, eventId, status, page = 1, limit = 10 } = req.query;

    if (id) {
      const nudge = await req.db.collection("nudges").findOne({
        _id: new ObjectId(id),
      });
      return res.json(nudge);
    }

    if (eventId) {
      const nudges = await req.db
        .collection("nudges")
        .find({ eventId: new ObjectId(eventId) })
        .sort({ scheduledTime: 1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .toArray();
      return res.json(nudges);
    }

    const query = status ? { status } : {};
    const nudges = await req.db
      .collection("nudges")
      .find(query)
      .sort({ scheduledTime: 1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    res.json(nudges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/nudges",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const nudgeData = {
        type: "nudge",
        eventId: new ObjectId(req.body.eventId),
        title: req.body.title,
        scheduledTime: new Date(req.body.scheduledTime),
        description: req.body.description,
        invitationText: req.body.invitationText,
        status: "scheduled",
        createdBy: parseInt(req.body.createdBy),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (req.files) {
        if (req.files.image) {
          nudgeData.image = `/uploads/${req.files.image[0].filename}`;
        }
        if (req.files.icon) {
          nudgeData.icon = `/uploads/${req.files.icon[0].filename}`;
        }
      }

      const result = await req.db.collection("nudges").insertOne(nudgeData);
      res.json({ id: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put(
  "/nudges/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const updateData = {
        title: req.body.title,
        scheduledTime: new Date(req.body.scheduledTime),
        description: req.body.description,
        invitationText: req.body.invitationText,
        updatedAt: new Date(),
      };

      if (req.files) {
        if (req.files.image) {
          updateData.image = `/uploads/${req.files.image[0].filename}`;
        }
        if (req.files.icon) {
          updateData.icon = `/uploads/${req.files.icon[0].filename}`;
        }
      }

      const result = await req.db
        .collection("nudges")
        .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Nudge not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.delete("/nudges/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const nudge = await req.db.collection("nudges").findOne({
      _id: new ObjectId(id),
    });

    if (!nudge) {
      return res.status(404).json({ error: "Nudge not found" });
    }

    if (nudge.image) {
      await fs.unlink(path.join(__dirname, "..", nudge.image));
    }
    if (nudge.icon) {
      await fs.unlink(path.join(__dirname, "..", nudge.icon));
    }

    await req.db.collection("nudges").deleteOne({ _id: new ObjectId(id) });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
