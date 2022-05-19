export default (client) => {
  return {
    uploadFile(file, onUploadProgress = function () {}) {
      const formData = new FormData()
      formData.append('file', file)

      const config = {
        onUploadProgress,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      return client.post('/user-files/upload-file/', formData, config)
    },
    uploadViaURL(url) {
      return client.post('/user-files/upload-via-url/', { url })
    },
  }
}
