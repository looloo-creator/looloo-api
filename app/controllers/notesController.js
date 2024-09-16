const Note = require('../models/note.model.js');

module.exports.create = (req, res) =>{
  // Validate request
  if(!req.body.content) {
      return res.status(400).send({
          message: "Note content can not be empty"
      });
  }

  // Create a Note
//   const note = new Note(req.body);

  // Save Note in the database
//   note.save()
//   .then(data => {
//       res.send(data);
//   }).catch(err => {
//       res.status(500).send({
//           message: err.message || "Some error occurred while creating the Note."
//       });
//   });
}
