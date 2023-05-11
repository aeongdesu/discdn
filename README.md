### env
`DISCORD_WEBHOOK`: discord webhook url

`THREAD_ID`: thread id (optional)

---

#### GET `/`
returns api key if you visited **first time.**

#### GET `/:code`
redirects to discord cdn url.

#### POST `/file/upload`
check sharex config!
returns object
```json
{
  "code": "",
  "url": "",
  "del_url": ""
}
```

#### GET `/delete/:code/:delcode`
returns `OK` if success

---

### ShareX config
```
{
  "Version": "15.0.0",
  "Name": "discdn",
  "DestinationType": "ImageUploader, FileUploader",
  "RequestMethod": "POST",
  "RequestURL": "https://DOMAIN_HERE/file/upload",
  "Headers": {
    "api_key": "API_KEY HERE"
  },
  "Body": "MultipartFormData",
  "FileFormName": "file",
  "URL": "{json:url}",
  "DeletionURL": "{json:del_url}"
}
```