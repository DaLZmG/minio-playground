# My onw Minio API

## Launching Docker containers:
Start **Docker engine** and bash execute:
```
docker run -p 9000:9000 -p 9001:9001   quay.io/minio/minio server /data --console-address ":9001"
```

## Creating Minio Keys
Browse to http://127.0.0.1:9001 login using: 
```
minioadmin // minioadmin
```
Goto ```Access Keys```, **create a new pair** and copy their values into the ```.env``` file.

## Launch the server
Use ```npm start``` to lauch the server app. 
