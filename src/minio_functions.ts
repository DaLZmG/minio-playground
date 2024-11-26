import * as Minio from "minio";

require('dotenv').config();
const { MINIO_ACCESS_KEY, MINIO_SECRET_KEY } = process.env;

const createClient = (): Promise<Minio.Client | undefined> => {
  return new Promise(async (resolve, reject) => {
    if (MINIO_ACCESS_KEY && MINIO_SECRET_KEY) {
      try {
        const minioClient = new Minio.Client({
          endPoint: "localhost",
          port: 9000,
          useSSL: false,
          accessKey: MINIO_ACCESS_KEY,
          secretKey: MINIO_SECRET_KEY
        });

        resolve(minioClient);
      } catch (error) {
        console.log(error);
        resolve(undefined);
      }
    } else {
      console.log('Please setup .env file');
      resolve(undefined);
    }
  })
}

export const listBuckets = (): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const myMinioClient = await createClient();
      if (myMinioClient) {
        myMinioClient.listBuckets()
          .then((resp) => {
            resolve({
              status: 200,
              message: 'Buckets listed',
              data: resp
            })
          })
          .catch((resp) => {
            reject({
              status: 404,
              message: 'Listing buckets error',
              data: resp
            })
          })
      } else {
        reject({
          status: 500,
          message: 'Minion client creation problem'
        })
      }
    } catch (error) {
      reject({
        status: 500,
        message: 'Listing buckets problem'
      })
    }
  })
}

export const createBucket = (bucketName: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const myMinioClient = await createClient();
      if (myMinioClient) {
        const bucketExists = await myMinioClient.bucketExists(bucketName);
        if (!bucketExists) {
          myMinioClient.makeBucket(bucketName)
            .then(() => {
              resolve({
                status: 200,
                message: 'Bucket created',
                data: {}
              })
            })
            .catch((resp) => {
              reject({
                status: 400,
                message: 'Bucket creation problem: ' + resp,
                data: {}
              })
            })
        } else {
          resolve({
            status: 201,
            message: `Bucket ${bucketName} already exists`,
            data: {}
          })
        }
      } else {
        reject({
          status: 500,
          message: 'Minion client creation problem'
        })
      }
    } catch (error) {
      reject({
        status: 500,
        message: 'Bucket creation problem, ' + error,
      })
    }
  })
}

export const uploadFile = (bucketName: string, fileName: string, filePath: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const myMinioClient = await createClient();
      if (myMinioClient) {
        myMinioClient.fPutObject(bucketName, fileName, filePath)
          .then(async (resp) => {
            resolve({
              status: 200,
              message: `File ${fileName} uploaded to ${bucketName}`,
              data: resp
            })
          })
          .catch((resp) => {
            reject({
              status: 400,
              message: `Error uploading ${fileName} to ${bucketName}`,
              data: {}
            })
          })
      } else {
        reject({
          status: 400,
          message: 'Error creating MinIO Client',
        });
      }
    } catch (error) {
      reject({
        status: 500,
        message: 'File uploading problem, ' + error
      })
    }
  })
}

export const donwloadFile = (bucketName: string, fileName: string, filePath: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const myMinioClient = await createClient();
      if (myMinioClient) {
        myMinioClient.fGetObject(bucketName, fileName, filePath)
          .then((resp) => {
            resolve({
              status: 200,
              message: `File ${fileName} downloaded from ${bucketName}`,
              data: resp
            })
          })
          .catch((resp) => {
            reject({
              status: 400,
              message: `Error downloading ${fileName} from ${bucketName}`,
              data: {}
            })
          })
      } else {
        reject({
          status: 400,
          message: 'Error creating MinIO Client',
        });
      }
    } catch (error) {
      reject({
        status: 500,
        message: 'File downloading problem, ' + error
      })
    }
  })
}

export const deleteFile = (bucketName: string, fileName: string):Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const myMinioClient = await createClient();
      if (myMinioClient) {
        myMinioClient.removeObject(bucketName, fileName)
          .then((resp) => {
            resolve({
              status: 200,
              message: `File ${fileName} deleted from ${bucketName}`,
              data: resp
            })
          })
          .catch((resp) => {
            reject({
              status: 400,
              message: `Error deleting ${fileName} from ${bucketName}`,
              data: {}
            })
          })
      } else {
        reject({
          status: 400,
          message: 'Error creating MinIO Client',
        });
      }
    } catch (error) {
      reject({
        status: 500,
        message: 'File deleting problem, ' + error
      })
    }  })
}

export const getFileSteam = (bucketName: string, fileName: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const myMinioClient = await createClient();
      if (myMinioClient) {
        const dataStream = await myMinioClient.getObject(bucketName, fileName)
        resolve(dataStream);
      } else {
        reject({
          status: 400,
          message: 'Error creating MinIO Client',
        });
      }
    } catch (error) {
      reject({
        status: 500,
        message: 'File downloading problem, ' + error
      })
    }
  })
}

export const listFiles = (bucketName: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const myMinioClient = await createClient();
      if (myMinioClient) {
        const buckObjs = myMinioClient.listObjects(bucketName, '', true);
        let data:object[] = [];
        buckObjs.on('data', (obj) => {
          data.push(obj)
        })
        buckObjs.on('end', () => {
          // console.log(data);
          resolve({ 
            status: 200,
            message: 'Files listed',
            data: data});
        })
        buckObjs.on('error', function (err) {
          console.log(err)
          reject(undefined);
        })
      } else {
        console.log({
          status: 400,
          message: 'Error listing files',
        });
        reject(undefined);
      }
    } catch (error) {
      console.log({
        status: 500,
        message: 'Error listing files',
      });
      reject(undefined);
    }
  })
}