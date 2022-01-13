![820px-Huawei_AppGallery](https://user-images.githubusercontent.com/71822189/116457944-51f2e180-a864-11eb-86b9-520603a9d63a.png)
# Deploy to Huawei App Gallery
This action uploads your .apk/.aab to Huawei App Gallery.

## Generate Client Keys

Client Id and the Client Key for that we need to create a new API key in the AppGallery console. Sign in to AppGallery Connect and select Users and permissions then Api Key > Connect API.
* set up your project as `N/A` and Add the role `Administrator` to it



## Inputs

### `client-id`

**Required** Client Id can be generated from Connect API

### `client-key`

**Required** Client Key can be generated from Connect API

### `app-id`

**Required** App Id can be found on App Information.

### `file-extension`

**Required** File name extension apk/rpk/pdf/jpg/jpeg/png/bmp/mp4/mov/aab.

### `file-path`

**Required** File path to upload

### `file-name` (String) default app-release

**Optional** Desired file name seen on AppGallery Connect after the upload. This will define a custom file name on AppGallery package file list. If not used, the file name shown on AppGallery Connect will be always app-release.extension.

### `submit` (BOOL) default false

**Optional** whether or not to submit automatically

## Sample usage

```
      - name: Deploy to Huawei App Gallery
        uses: muhamedzeema/appgallery-deply-action@main
        with:
          client-id: ${{secrets.HUAWEI_CLIENT_ID}}
          client-key: ${{secrets.HUAWEI_CLIENT_KEY}}
          app-id: ${{secrets.HUAWEI_APP_ID}}
          file-extension: "apk"
          file-path: "apk/release/app-release.apk"
          file-name: "MyAppName-1.0.0"
          submit: true
