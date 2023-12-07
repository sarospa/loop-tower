// @ts-check
// Google cloud stuff

class GoogleCloud {
    static #CLIENT_ID = "550385076459-ek9ul9e3oo7ootou8bplmfjhfof1nntn.apps.googleusercontent.com";

    scope = "https://www.googleapis.com/auth/drive.appdata";

    /** @type {google.accounts.oauth2.TokenResponse} */
    tokenResponse;
    /** @type {number} */
    tokenExpiry;

    #initialized = false;
    #gapiLoaded = false;
    /** @type {Promise} */
    #gapiPromise;
    /** @type {Promise} */
    #authzPromise = null;

    /** @type {(success: boolean) => void} */
    #tokenHandler;

    init() {
        if (this.#initialized) return;
        this.#initialized = true;
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GoogleCloud.#CLIENT_ID,
            scope: this.scope,
            callback: (response) => this.handleToken(response),
        });
        this.#gapiPromise = new Promise((resolve, reject) => gapi.load("client", () => {
            gapi.client.init({
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            }).then(() => {
                this.#gapiLoaded = true;
                resolve();
            }, reject);
        }));
    }

    revoke() {
        if (gapi.client.getToken() != null) {
            console.log("revoking cloud auth");
            google.accounts.oauth2.revoke(this.tokenResponse.access_token, () => {
                gapi.client.setToken(null);
            });
        }
    }

    authorize(userRequest) {
        console.log("starting authorize for",{userRequest,promise:this.#authzPromise,token:gapi.client.getToken(),expiry:this.tokenExpiry});
        this.#authzPromise ??= new Promise((resolve, reject) => {
            if (gapi.client.getToken() == null || Date.now() > this.tokenExpiry) {
                console.log("requesting access token");
                this.#tokenHandler = success => success ? resolve() : reject();
                this.tokenClient.requestAccessToken({
                    prompt: "",
                });
            } else {
                gapi.client.request({path: '/oauth2/v1/tokeninfo'}).then(resolve, reject);
            }
        }).catch(() => {
            gapi.client.setToken(null);
        }).finally(() => {
            this.#authzPromise = null;
        });
        return this.#authzPromise;
    }

    uploadFile(metadata, mimeType, data) {
        const boundary = 'IdleLoops';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        
        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify({mimeType, ...metadata}) +
            delimiter +
            'Content-Type: ' + mimeType + '\r\n\r\n' +
            data +
            close_delim;
        
        return gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: {uploadType: "multipart"},
            headers: {
                "Content-Type": `multipart/related; boundary="${boundary}"`,
            },
            body: multipartRequestBody
        });
    }

    async deleteFile(fileId) {
        await this.authorize("delete");
        console.log("performing cloud delete");
        await gapi.client.drive.files.delete({
            fileId,
        });
        view.requestUpdate("updateCloudSave", {id: fileId});
    }

    async renameFile(fileId, newName) {
        await this.authorize("rename");
        console.log("performing cloud rename");
        const response = await gapi.client.drive.files.update({
            fileId,
            resource: {
                name: newName,
            },
        });
        if (response.result) view.requestUpdate("updateCloudSave", response.result);
    }

    async importFile(fileId) {
        await this.authorize("import");
        console.log("performing cloud import");
        const response = await gapi.client.drive.files.get({fileId,alt:"media"});
        // console.log("got response:",response);
        processSave(response.body);
    }

    async exportSave() {
        await this.authorize("save");
        console.log("performing cloud save");
        save();
        const data = currentSaveData();
        const name = saveFileName().replace(".txt","");
        await this.uploadFile({
            name,
            parents: ["appDataFolder"],
        }, "text/plain", data);
        view.requestUpdate("updateCloudSave", _txt("menu>save>cloud_saved").replace("{name}", name));
        console.log("cloud save complete");
    }

    async loadSaves() {
        await this.authorize("load");
        console.log("performing cloud load");
        const response = await gapi.client.drive.files.list({
            spaces: "appDataFolder",
            fields: "files(id,name)",
        });
        view.requestUpdate("updateCloudSave", ""); // clear the list
        for (const file of response.result?.files) {
            view.requestUpdate("updateCloudSave", file);
        }
    }

    /** @param {google.accounts.oauth2.TokenResponse} response  */
    handleToken(response) {
        console.log("Got token response:",response);
        this.tokenResponse = response;
        this.tokenExpiry = parseInt(response?.expires_in) * 1000 + Date.now();

        this.#tokenHandler?.(google.accounts.oauth2.hasGrantedAllScopes(response, this.scope));
        this.#tokenHandler = null;
    }
}


