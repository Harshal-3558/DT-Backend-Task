const express = require('express');
const { ObjectId } = require('mongodb');
const upload = require('../upload');

const router = express.Router();

router.get('/events', async (req, res) => {
  try {
    const { id } = req.query;

    if (id) {
      const event = await req.db.collection('events').findOne({ 
        _id: new ObjectId(id) 
      });
      return res.json(event);
    }

    const { type, limit = 5, page = 1 } = req.query;
    
    if (type === 'latest') {
      const events = await req.db.collection('events')
        .find()
        .sort({ schedule: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .toArray();
      return res.json(events);
    }

    res.status(400).json({ error: 'Invalid query parameters' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/events', upload.single('image'), async (req, res) => {
  try {
    const eventData = {
      type: 'event',
      uid: parseInt(req.body.uid),
      name: req.body.name,
      tagline: req.body.tagline,
      schedule: new Date(req.body.schedule),
      description: req.body.description,
      files: {
        image: req.file ? `/uploads/${req.file.filename}` : null
      },
      moderator: req.body.moderator,
      category: req.body.category,
      sub_category: req.body.sub_category,
      rigor_rank: parseInt(req.body.rigor_rank),
      attendees: []
    };

    const result = await req.db.collection('events').insertOne(eventData);
    res.json({ id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/events/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {
      name: req.body.name,
      tagline: req.body.tagline,
      schedule: new Date(req.body.schedule),
      description: req.body.description,
      moderator: req.body.moderator,
      category: req.body.category,
      sub_category: req.body.sub_category,
      rigor_rank: parseInt(req.body.rigor_rank)
    };

    if (req.file) {
      updateData['files.image'] = `/uploads/${req.file.filename}`;
    }

    const result = await req.db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.collection('events').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;