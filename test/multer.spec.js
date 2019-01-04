'use strict';


/* dependencies */
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const onFinished = require('on-finished');
const UploadForm = require('form-data');
const multer = require('multer');
const { expect } = require('chai');
const { createBucket } = require(path.join(__dirname, '..', 'lib', 'bucket'));


/* helpers: https://github.com/expressjs/multer/blob/master/test/_util.js */
const file = name => fs.createReadStream(path.join(__dirname, 'fixtures', name));

const fileSize = name => fs.statSync(path.join(__dirname, 'fixtures', name)).size;

const submitForm = (multer, form, cb) => {
  form.getLength((err, length) => {
    if (err) { return cb(err); }

    const req = new stream.PassThrough();

    req.complete = false;
    form.once('end', () => req.complete = true);
    form.pipe(req);
    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': length
    };

    multer(req, null, (err) => {
      onFinished(req, () => cb(err, req));
    });
  });
};

/* specs: https://github.com/expressjs/multer/blob/master/test/disk-storage.js */
describe.only('multer storage', () => {

  it('should process parser/form-data POST request', (done) => {
    const storage = createBucket();
    const upload = multer({ storage });

    const form = new UploadForm();
    const parser = upload.single('text');

    const aliases = 'lyrics';
    form.append('name', 'Lyrics');
    form.append('aliases', aliases);
    form.append('text', file('text.txt'));

    submitForm(parser, form, (err, req) => {
      expect(err).to.not.exist;
      expect(req.body.name).to.be.equal('Lyrics');
      expect(req.body.aliases).to.be.equal('lyrics');
      expect(req.file.fieldname).to.be.equal('text');
      expect(req.file.originalname).to.be.equal('text.txt');
      expect(req.file.size).to.be.equal(fileSize('text.txt'));
      expect(req.file.aliases).to.be.eql(['lyrics']);

      done();
    });
  });

});