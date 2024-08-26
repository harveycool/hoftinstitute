AWS.config.update({
  accessKeyId: "DO00JV9GL7CYLW8G8E3D",
  secretAccessKey: "A+h2NgptkKly2VYNZxz7sRX/bfTWDDQkl1MWVMzwTFU",
});

const spacesEndpoint = new AWS.Endpoint("nyc3.digitaloceanspaces.com");

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  s3ForcePathStyle: true,
});

const params = {
  Bucket: "hoftfiles",
  prefix: "AnswerVideos/",
};

// Select the video player and the video list from the HTML
const questionVideo = document.getElementById("questionVideo");
const videoList = document.getElementById("videoList");
window.onload = function () {
  s3.listObjectsV2(
    { Bucket: "hoftfiles", Prefix: "AnswerVideos/" },
    function (err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
        data.Contents.forEach((file) => {
          const link = document.createElement("a");
          link.href = "#";
          link.textContent = file.Key;
          link.onclick = function () {
            if (!file.Key.endsWith("/")) {
              // If the object is a file, generate a signed URL and play the video
              const videoUrl = s3.getSignedUrl("getObject", {
                Bucket: "hoftfiles",
                Key: file.Key,
                Expires: 60 * 30, // 30 minutes
              });
              questionVideo.src = videoUrl;
            }
            return false; // Prevent the link from actually navigating
          };

          const listItem = document.createElement("li");
          listItem.appendChild(link);

          videoList.appendChild(listItem);
        });
      }
    }
  );
};
