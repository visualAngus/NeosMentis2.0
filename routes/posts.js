const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Liste des posts');
});

module.exports = router;
