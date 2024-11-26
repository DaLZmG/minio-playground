// Common 
function showInfo(infoTextElName, infoText, isError = false) {
  const infoTextElment = document.getElementById(infoTextElName);

  const errorTextColor = "text-red-400";
  const regularTextColor = "text-green-400";

  if (isError) {
    infoTextElment.classList.remove(regularTextColor);
    infoTextElment.classList.add(errorTextColor);
  } else {
    infoTextElment.classList.add(regularTextColor);
    infoTextElment.classList.remove(errorTextColor);
  }

  infoTextElment.classList.remove('hidden');
  infoTextElment.innerText = infoText;
}

function showLoading(isLoading = false) {
  const loadingSpin = document.getElementById('loadingSpinner');
  if (isLoading) {
    loadingSpin.classList.remove('hidden');
    // console.log('Loading ...');
  } else {
    loadingSpin.classList.add('hidden');
    // console.log('Not loading ...');
  }
}

// Buckets
async function startCreatingBucket() {
  const bucketName = document.getElementById("newBucketName");

  if (bucketName.value) {
    createBucket(bucketName.value);
  } else {
    console.log('You must enter a name for the new bucket');
    showInfo("bucketCreationInfoText", "You must enter a new bucket name", true);
  }
}

async function createBucket(bucketName) {
  let data = new FormData();

  data.append("bucketName", bucketName);

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: '/createBucket',
    headers: {
      'Content-Type': 'mulpart/form-data'
    },
    data: data
  };

  axios.request(config)
    .then((resp) => {
      showInfo("bucketCreationInfoText", resp.data);

      reloadBucketSelectors();
    })
    .catch((error) => {
      console.log(error);
      showInfo("bucketCreationInfoText", 'Error:\n' + error);
    })
}

async function loadBucket(bucketSelect) {
  await getBuckets()
    .then((resp) => {
      bucketSelect.innerHTML = '';

      const blankOpt = document.createElement('option');
      blankOpt.disabled = true;
      blankOpt.selected = true;
      blankOpt.hidden = true;
      bucketSelect.add(blankOpt);
      for (const bucket of resp.data.data) {
        const newOption = document.createElement('option');
        newOption.value = bucket.name;
        newOption.text = bucket.name;
        bucketSelect.add(newOption);
      }
    })
    .catch((error) => {
      console.error(error);
    })
}

async function getBuckets() {
  return new Promise(async (resolve, reject) => {
    await axios.get('/listBuckets')
      .then((resp) => {
        resolve(resp);
      })
      .catch((error) => {
        reject(error);
      });
  })
}

function reloadBucketSelectors() {
  const selectBucketUp = document.getElementById("uploadBucket");
  const selectBucketDown = document.getElementById("downloadBucket");
  const selectBucketDel = document.getElementById("deleteBucket");
  const selectFileDown = document.getElementById("downloadFile")
  const selectFileDel = document.getElementById("deleteFile")

  loadBucket(selectBucketUp);
  loadBucket(selectBucketDown);
  loadBucket(selectBucketDel);

  selectBucketDown.addEventListener("change", (event) => {
    loadFiles(selectFileDown, selectBucketDown.value)
  });

  selectBucketDel.addEventListener("change", (event) => {
    loadFiles(selectFileDel, selectBucketDel.value)
  });
}

// Files
async function startUploading() {
  const bucketName = document.getElementById("uploadBucket").value;
  const newName = document.getElementById("upFileName").value;
  const folderName = document.getElementById("upFolderName").value;
  const localFile = document.getElementById("fileSelected").files[0];

  if (localFile && bucketName) {
    uploadFile(bucketName, newName, folderName, localFile);
  } else {
    showInfo("fileUploadingInfoText", "You must select a bucket and a file to upload", true);
  }
}

async function startDownloading() {
  const bucketName = document.getElementById("downloadBucket").value;
  const fileURL = document.getElementById("downloadFile").value;

  if (bucketName && fileURL) {
    downLoadFile(bucketName, fileURL);
  } else {
    showInfo("fileDownloadingInfoText", "You must select a bucket and a file to donwload", true);
  }

}

async function startDeleting() {
  const bucketName = document.getElementById('deleteBucket').value;
  const fileURL = document.getElementById('deleteFile').value;

  if (bucketName && fileURL) {
    deleteFile(bucketName, fileURL);
  } else {
    showInfo("fileDeletingInfoText", "You must select a bucket and a file to delete", true);
  }
}

async function uploadFile(bucketName, newName, folderName, localFile) {
  let data = new FormData();

  showLoading(true);

  data.append('fileSelected', localFile);
  data.append('bucketName', bucketName);
  data.append('newName', newName);
  data.append('folderName', folderName);

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: '/uploadFile',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: data
  };

  axios.request(config)
    .then((response) => {
      // console.log(JSON.stringify(response.data));
      showInfo("fileUploadingInfoText", "Upload complete!\n" + response.data.etag);
      showLoading(false);
    })
    .catch((error) => {
      console.log(error);
      showInfo("fileUploadingInfoText", 'Error:\n' + error, true);
      showLoading(false);
    });

}

async function downLoadFile(bucketName, fileURL) {
  let data = new FormData();

  data.append("bucketName", bucketName);
  data.append("fileURL", fileURL);

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: '/downloadFile',
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: data
  };

  axios.request(config)
    .then((resp) => {
      window.showSaveFilePicker()
        .then(async (handler) => {
          let result;
          let writable = await handler.createWritable();
          writable.write(resp.data);
          writable.close();
          showInfo("fileDownloadingInfoText", 'File donwloaded', false);
        })
        .catch((err) => {
          console.error(err)
          showInfo("fileDownloadingInfoText", 'Error:\n' + error, true);
        });
    })
    .catch((error) => {
      console.log(error);
      showInfo("fileDownloadingInfoText", 'Error:\n' + error, true);
    })
}

async function deleteFile(bucketName, fileURL) {
  let data = new FormData();

  data.append("bucketName", bucketName);
  data.append("fileURL", fileURL);

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: '/deleteFile',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: data
  };

  axios.request(config)
    .then((resp) => {
      console.log(resp);
      showInfo("fileDeletingInfoText", resp.data, false);
      const selectBucketDel = document.getElementById("deleteBucket");
      const selectFileDel = document.getElementById("deleteFile")
      loadFiles(selectFileDel, selectBucketDel.value)

    })
    .catch((error) => {
      console.log(error);
      showInfo("fileDeletingInfoText", 'Error:\n' + error, true);
    })
}

async function loadFiles(fileSelect, bucketName) {
  await getFiles(bucketName)
    .then((resp) => {
      fileSelect.innerHTML = '';
      for (const file of resp.data) {
        const newOption = document.createElement('option');
        newOption.value = file.name;
        newOption.text = file.name + " (" + file.size + " bytes)";
        fileSelect.add(newOption);
      }
    })
    .catch((error) => {
      console.error(error);
    })
}

async function getFiles(bucketName) {
  return new Promise(async (resolve, reject) => {
    let formData = new FormData();
    formData.append("bucket", bucketName);
    await axios.get('/listFiles?bucket=' + bucketName)
      .then((resp) => {
        resolve(resp);
      })
      .catch((error) => {
        reject(error);
      })
  })
}


document.addEventListener('DOMContentLoaded', () => {
  reloadBucketSelectors();

  showLoading(false);
});
