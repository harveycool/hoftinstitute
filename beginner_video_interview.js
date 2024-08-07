const questionVideo = document.getElementById("questionVideo");
const answerRecorder = document.getElementById("answerRecorder");
const startQuestionBtn = document.getElementById("startQuestion");
const nextQuestionBtn = document.getElementById("nextQuestion");
const answerRecorderWarning = document.getElementById("answerRecorderWarning");
var bufferProgress = document.getElementById("uploadProgressBar");
let startBtnPressed = false;

//Progress Bar code is not working. Fix later
const uploadProgressBar = document.getElementById("uploadProgressBar");
const progressPercentageLabel = document.getElementById(
  "progressPercentageLabel"
);
const progressBarLabel = document.querySelector(
  `label[for='${uploadProgressBar.id}']`
);
uploadProgressBar.style.display = "none";
progressPercentageLabel.style.display = "none";
progressBarLabel.style.display = "none";

AWS.config.update({
  accessKeyId: "DO00JV9GL7CYLW8G8E3D",
  secretAccessKey: "A+h2NgptkKly2VYNZxz7sRX/bfTWDDQkl1MWVMzwTFU",
});

const spacesEndpoint = new AWS.Endpoint("nyc3.digitaloceanspaces.com");

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
});

const videoKeys = ["bv1.mp4", "bv2.mp4"];

const videoSources = videoKeys.map((key) => {
  const params = {
    Bucket: "hoftfiles",
    Key: key,
    Expires: 60 * 10,
  };
  return s3.getSignedUrl("getObject", params);
});

console.log(videoSources);
let currentVideo = 0;

function loadUserMedia() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then(async function (stream) {
      answerRecorder.srcObject = stream;
      answerRecorder.muted = true;
      answerRecorder
        .play()
        .then(() => {
          console.log("Camera stream started successfully");
          answerRecorderWarning.textContent =
            "Click on the 'Start Question' button to start the question video.";
        })
        .catch((err) => {
          console.error("Error starting camera stream: ", err);
          answerRecorderWarning.textContent =
            "Please refresh the page and allow the camera and microphone access.";
        });
    })
    .catch((err) => {
      console.error("Error getting user media: ", err);
      answerRecorderWarning.textContent =
        "Please refresh the page and allow the camera and microphone access.";
    });
  nextQuestionBtn.disabled = true;
  questionVideo.src = videoSources[currentVideo];
}

startQuestionBtn.addEventListener("click", function () {
  startBtnPressed = true;
  questionVideo.play();
  answerRecorderWarning.textContent = `Video is loading and it will start playing automactically when it is ready`;
});

questionVideo.addEventListener("error", function (event) {
  console.error("Video error: ", event);
});

// questionVideo.addEventListener("canPlayThrough", function () {
//   questionVideo.play();
// });

questionVideo.addEventListener("loadedmetadata", function () {
  var bufferChecker = setInterval(function () {
    if (questionVideo.buffered.length === 0) {
      console.log("Video is not buffering");
      return;
    }

    var bufferedSeconds =
      questionVideo.buffered.end(0) - questionVideo.buffered.start(0);
    var progress = (bufferedSeconds / questionVideo.duration) * 100;
    bufferProgress.value = progress;
    if (bufferedSeconds >= questionVideo.duration) {
      clearInterval(bufferChecker);
      questionVideo.muted = false;
      questionVideo.play();
    }
    console.log("Buffered seconds: ", bufferedSeconds);
  }, 500);
});

questionVideo.addEventListener(
  "waiting",
  function () {
    // This event is fired when the video is waiting for more data to load
    console.log("Video is waiting for more data");
  },
  false
);
function startRecording() {
  let vidChunks = [];
  console.log("Recording started");
  answerRecorderWarning.textContent =
    "Recording started. Please answer the question.";
  const mediaRecorder = new MediaRecorder(answerRecorder.srcObject);
  mediaRecorder.start();
  console.log("Recording really started", mediaRecorder.state);
  // This is the countdown timer for the duration of the recording. Change the number of seconds according to Blair
  let countdown = 10;
  const countdownInterval = setInterval(() => {
    countdown--;
    answerRecorderWarning.textContent = `Recording ${countdown} seconds left.`;
    if (countdown === 0) {
      clearInterval(countdownInterval);
      answerRecorderWarning.textContent = `Recording stopped. Answer video is being uploaded.
      This may take a while depending on your Internet connection. 
      Please do not leave this page until the upload is finsihed.`;
    }
  }, 1000);

  // if (mediaRecorder.state !== "inactive") {
  //   console.log("Media recorder is active");
  // } else {
  //   console.log("Recording is actually working");
  // }
  //console.log("Before setTimeout");
  mediaRecorder.ondataavailable = function (x) {
    vidChunks.push(x.data);
  };
  mediaRecorder.onstop = function () {
    const ansBlob = new Blob(vidChunks, { type: "video/mp4" });
    const fileName = `AnsVideo_${currentVideo + 1}.mp4`;
    const file = new File([ansBlob], fileName, { type: "video/mp4" });
    console.log(`File name: ${file.name}`);
    const timestamp = new Date().toLocaleString(); // Example timestamp

    const params = {
      Bucket: "hoftfiles",
      Key: `AnswerVideos/${timestamp}/${file.name}`,
      Body: file,
      ACL: "public-read",
    };
    // const uploadProgress = new AWS.S3.ManagedUpload({
    //   params: params,
    // });
    // uploadProgress.on("httpUploadProgress", function (evt) {
    //   const uploadPercentage = Math.round((evt.loaded / evt.total) * 100);
    //   uploadProgressBar.style.display = "block";
    //   uploadProgressBar.style.width = `${uploadPercentage}%`;
    //   progressPercentageLabel.style.display = "block";
    //   progressBarLabel.style.display = "block";
    // });
    // uploadProgress.send(function (err, data) {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     uploadProgressBar.style.display = "none";
    //     progressPercentageLabel.style.display = "none";
    //     progressBarLabel.style.display = "none";
    //   }
    // });
    s3.upload(params, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
        answerRecorderWarning.textContent = `Answer video uploaded successfully. Click on the 'Next Question' button to proceed.`;
      }
    });
  };
  setTimeout(() => {
    console.log("Inside setTimeout");
    mediaRecorder.stop();
    console.log("After setTimeout");
  }, 10000);
}

questionVideo.addEventListener("ended", function () {
  nextQuestionBtn.disabled = false;
  questionVideo.pause();
  answerRecorderWarning.textContent = "The recording will start in 5 seconds.";
  startQuestionBtn.disabled = true;
  startRecording();
});

nextQuestionBtn.addEventListener("click", function () {
  console.log("Next question button clicked");
  currentVideo++;
  if (currentVideo < videoSources.length) {
    document.getElementById("questionVideo").src = videoSources[currentVideo];
    startQuestionBtn.disabled = false;
  } else {
    console.log("All questions completed");
    questionVideo.pause();
    answerRecorderWarning.textContent =
      "All questions completed. Thank you for participating.";
    nextQuestionBtn.disabled = true;
  }

  questionVideo.load();
});

loadUserMedia();
