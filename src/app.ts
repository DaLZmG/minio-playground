import express from "express";
import fileUpload from 'express-fileupload';
import { createBucket, deleteFile, donwloadFile, getFileSteam, listBuckets, listFiles, uploadFile } from "./minio_functions";

require('dotenv').config();
const { PORT } = process.env;

const bucket1Name = 'testbucket1';
const bucket2Name = 'testbucket2';

const tempFolder = './tmp/';

export interface TypedRequestBody<T> extends Express.Request {
  params: T
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: tempFolder
}));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.status(200).send('Server working');
})

app.get('/listBuckets', async (req, res) => {
  try {
    await listBuckets()
      .then((resp) => {
        // console.log(resp.status, resp.message);
        console.log(resp.status, { "message": resp.message, "data": resp.data });
        res.status(200).send(resp);
      }).catch((resp) => {
        console.error(resp.status, { "message": resp.message, "data": resp.data });
        res.status(resp.status).send(resp);
      });
  } catch (error) {
    res.status(500).send('Fatal error');
  }
})

app.get('/listFiles', async (req, res) => {
  if (req.query.bucket) {
    await listFiles(req.query.bucket.toString())
      .then((resp) => {
        console.log(resp.status, { "message": resp.message, "data": resp.data });
        res.status(200).send(resp.data);
      }).catch((resp) => {
        console.error(resp.status, { "message": resp.message, "data": resp.data });
        res.status(resp.status).send(resp);
      });
  } else {
    res.status(400).send('Bad params');
  }
})

app.post('/createBucket', async (req, res) => {
  try {
    if (req.body.bucketName) {
      const bucketName = req.body.bucketName;

      createBucket(bucketName)
        .then((resp) => {
          console.log(resp);
          res.status(resp.status).send(resp.message);
        })
        .catch((error) => {
          console.error(error);
          res.status(error.status).send(error.message);
        })
    }
  } catch (error) {
    console.log('Fatal Error');
    res.status(500).send('Fatal error');
  }
})

app.post('/uploadFile', async (req, res) => {
  try {
    if (req.body.bucketName) {
      const bucketName = req.body.bucketName;
      if (req.files) {
        const fileToUpload = req.files.fileSelected;
        if ('name' in fileToUpload) {
          let fileName = fileToUpload.name;
          const filePath = fileToUpload.tempFilePath;
          let upPath = '';

          if (req.body.newName) {
            fileName = req.body.newName;
          }
          if (req.body.folderName) {
            upPath = req.body.folderName + '/' + fileName;
          }

          if (upPath == '') {
            upPath = fileName;
          }

          createBucket(bucketName)
            .then(async (resp) => {
              console.log(resp);
              // res.status(resp.status).send(resp.message);

              uploadFile(bucketName, upPath, filePath)
                .then((resp) => {
                  console.log(resp);
                  res.status(resp.status).send(resp.data);
                })
                .catch((resp) => {
                  console.error(resp);
                  res.status(resp.status).send(resp);
                })
            })
            .catch((error) => {
              console.error(error);
              res.status(error.status).send(error.message);
            })
        } else {
          console.log('Problem with selected file');
          res.status(500).send('Problem with selected file');
        }
      } else {
        res.status(500).send('Fatal error');
      }
    } else {
      res.status(400).send('Bad params');
    }
  } catch (error) {
    res.status(500).send('Fatal error');
  }
})

app.post('/downloadFile', async (req, res) => {
  try {
    if(req.body.bucketName && req.body.fileURL) {
      const bucketName = req.body.bucketName;
      const fileName = req.body.fileURL;
      const localPath = './tmp/' + req.body.fileURL;
  
      createBucket(bucketName)
        .then(async (resp) => { 
          const dstream = await getFileSteam(bucketName, fileName);

          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

          dstream.pipe(res);

          // donwloadFile(bucketName, fileName, localPath)
          //   .then((resp) => {
          //     console.log(resp.message);
          //     res.status(resp.status).sendFile(process.cwd() + `\\tmp\\` + fileName,);
          //   })
          //   .catch((resp) => {
          //     console.error(resp.message);
          //     res.status(resp.status).send(resp.message);
          //   })
        })
        .catch((resp) => {
          console.error(resp);
          res.status(resp.status).send(resp.message);
        })
    } else {
      res.status(400).send('Bad params');
    }
  } catch (error) {
    res.status(500).send('Fatal error');
  }
})

app.post('/deleteFile', async (req, res) => {
  try {
    if(req.body.bucketName && req.body.fileURL) {
      const bucketName = req.body.bucketName;
      const fileName = req.body.fileURL;
  
      createBucket(bucketName)
        .then(async (resp) => { 
          await deleteFile(bucketName, fileName)
            .then((resp) => {
              console.log(resp);
              res.status(200).send(resp.message);
            })
            .catch((error) => {
              console.log(error);
              res.status(400).send(error.message);
            })
        })
        .catch((resp) => {
          console.error(resp);
          res.status(resp.status).send(resp.message);
        })
    } else {
      res.status(400).send('Bad params');
    }
  } catch (error) {
    res.status(500).send('Fatal error');
  }
})

function initBucket(bucketName: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    createBucket(bucketName)
      .then(async (resp) => {
        console.log(resp)
        resolve();
      })
      .catch((error) => {
        console.error(error);
        reject();
      })
  })
}

app.listen(PORT, async () => {
  try {
    await initBucket(bucket1Name);
    await initBucket(bucket2Name);

    // console.log(`Listing objects in ${bucket1Name}`);
    // await listFiles(bucket1Name);
    // console.log(`Listing objects in ${bucket2Name}`);
    // await listFiles(bucket2Name);

    await listBuckets()
      .then((resp) => {
        // console.log(resp.status, resp.message);
        console.log(resp.data);
      })
      .catch((resp) => {
        console.error(resp.status, resp.message);
        process.exit(-1);
      });
  } catch (error) {
    process.exit(-1);
  }

  console.log(`Server started on port: ${PORT}`);
})
