const BoxSDK = require('box-node-sdk');
const express = require('express');
const app = express()
const port = 8080;
app.use(express.json())
const fs = require('fs')

var sdk = new BoxSDK({
    clientID: '[CLIENT_ID]',
    clientSecret: '[CLIENT_SECRET]'
  });

const secondSDK = new BoxSDK({
    clientID: '[CLIENT_ID]',
    clientSecret: '[CLIENT_SECRET]'
})

const firstAccountParentFolder = '[FOLDER_ID]'
const secondAccountParentFolder = '[FOLDER_ID]'

const targetURL = '[PUBLIC_WEBHOOK_TARGET_URL]'
  
  // Create a basic API client, which does not automatically refresh the access token
var client = sdk.getBasicClient('[DEV_TOKEN]');
const secondClient = secondSDK.getBasicClient('[DEV_TOKEN]')

const initEnvironment = async () => {
    //create a folder

    const date = new Date()
    let folder = await client.folders.create(firstAccountParentFolder, `Webhook Folder - ${date}`)
    //Create a webhook on the folder for file uploaded
    
    client.webhooks.create(folder.id, client.itemTypes.FOLDER, targetURL + 'webhook', [client.webhooks.triggerTypes.FILE.UPLOADED])

    let secondFolder = await secondClient.folders.create(secondAccountParentFolder, `Webhook Folder - ${date}`)
    //Create a webhook on the folder for file uploaded
    
    secondClient.webhooks.create(secondFolder.id, secondClient.itemTypes.FOLDER, targetURL + 'webhook', [secondClient.webhooks.triggerTypes.FILE.UPLOADED])


}



const handleWebhookPayload = (payload) => {

    //Download File and check if the payload is coming from account 1
    //This check was only really necessary for demo purposes
    if (payload.created_by.login === '[ADMIN_EMAIL]') {
        client.files.getReadStream(payload.source.id, null, function(error, stream) {

            if (error) {
                // handle error
            }
        
            // write the file to disk
            var output = fs.createWriteStream('./files/' + payload.source.name);
            stream.pipe(output);
            output.on('finish', () => {
                upload(payload)
            })
        });
    } else {
        secondClient.files.getReadStream(payload.source.id, null, function(error, stream) {

            if (error) {
                // handle error
            }
        
            // write the file to disk
            var output = fs.createWriteStream('./files/' + payload.source.name);
            stream.pipe(output);
            output.on('finish', () => {
                upload(payload)
            })
        });
    }
}


const upload = (payload) => {
    var stream = fs.createReadStream('./files/' + payload.source.name);
    //Upload to another account
    //This check was only really necessary for demo purposes
    if (payload.created_by.login === 'roryoconnor@boxdemo.com') {
        secondClient.files.uploadFile(secondAccountParentFolder, payload.source.name, stream)
            .then(result => {
                console.log(result)
        })
    } else {
        client.files.uploadFile(firstAccountParentFolder, payload.source.name, stream)
            .then(result => {
                console.log(result)
            
        }).catch(e => {
            console.log(e)
        })
    }
}

app.get('/', (req, res) => {
    console.log('hi')
    initEnvironment()
    res.send('Hello World!')
  })

  app.post('/webhook', (req, res) => {
    console.log('req', req.body)
    handleWebhookPayload(req.body)
    res.send('Hello World!')
  })
  
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})