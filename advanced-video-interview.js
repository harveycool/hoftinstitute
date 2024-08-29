const questionVideo = document.getElementById("questionVideo");
const answerRecorder = document.getElementById("answerRecorder");
const startQuestionBtn = document.getElementById("startQuestion");
const nextQuestionBtn = document.getElementById("nextQuestion");
const answerRecorderWarning = document.getElementById("answerRecorderWarning");
const questionHeader = document.getElementById("questionHeader");
const extraContent = document.getElementById("extraContent");
const forceNextQuestionBtn = document.getElementById("forceNextQuestion");
let mediaRecorder;

//Getting all the personal data from the main page
const firstName = sessionStorage.getItem("firstName");
const lastName = sessionStorage.getItem("lastName");
const email = sessionStorage.getItem("email");

AWS.config.update({
  accessKeyId: "DO00JV9GL7CYLW8G8E3D",
  secretAccessKey: "A+h2NgptkKly2VYNZxz7sRX/bfTWDDQkl1MWVMzwTFU",
});

const spacesEndpoint = new AWS.Endpoint("nyc3.digitaloceanspaces.com");

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
});

const videoKeys = [
  "aqv1.MOV",
  "aqv2.MOV",
  "aqv3.MOV",
  "aqv4.MOV",
  "aqv5.MOV",
  "aqv6.MOV",
  "aqv7.MOV",
  "aqv8.MOV",
  "aqv9.MOV",
  "endofInterview.MOV",
];
``;
const answerDuration = {
  "aqv1.mp4": 6,
  "aqv2.MOV": 31,
  "aqv3.MOV": 31,
  "aqv4.MOV": 16,
  "aqv5.MOV": 31,
  "aqv6.MOV": 31,
  "aqv7.MOV": 31,
  "aqv8.MOV": 31,
  "aqv9.MOV": 61,
  "endofInterview.MOV": 0,
};

const videoSources = videoKeys.map((key) => {
  const params = {
    Bucket: "hoftfiles",
    Key: `questionVideos/advancedQuestionVideos/${key}`,
    Expires: 60 * 30,
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
      mediaRecorder = new MediaRecorder(stream);
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
  questionHeader.textContent = `Question ${currentVideo + 1} of ${
    videoKeys.length
  }`;
  questionVideo.load();
  if (videoSources === "endofInterview.MOV") {
    // Disable the buttons
    startQuestionBtn.disabled = true;
    nextQuestionBtn.disabled = true;
    questionVideo.autoplay = true;
    answerRecorderWarning.textContent =
      "You may leave this page now. Your interview has been successfully uploaded.";
  } else {
    questionVideo.autoplay = false;
  }
}

startQuestionBtn.addEventListener("click", function () {
  questionVideo.play();
  startQuestionBtn.disabled = true;
  answerRecorderWarning.textContent = `Video is loading and it will start playing automatically when it is ready`;
});

questionVideo.addEventListener("error", function () {
  switch (questionVideo.error.code) {
    case questionVideo.error.MEDIA_ERR_ABORTED:
      console.error("You aborted the video playback.");
      break;
    case questionVideo.error.MEDIA_ERR_NETWORK:
      console.error("A network error caused the video download to fail.");
      break;
    case questionVideo.error.MEDIA_ERR_DECODE:
      console.error(
        "The video playback was aborted due to a corruption problem or because the video used features your browser did not support."
      );
      break;
    case questionVideo.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
      console.error(
        "The video could not be loaded, either because the server or network failed or because the format is not supported."
      );
      break;
    default:
      console.error("An unknown error occurred.");
      break;
  }
});

questionVideo.addEventListener("canPlayThrough", function () {
  questionVideo.play();
});

questionVideo.addEventListener(
  "waiting",
  function () {
    // This event is fired when the video is waiting for more data to load
    console.log("Video is waiting for more data");
  },
  false
);

function endofInterview() {
  startQuestionBtn.disabled = true;
  nextQuestionBtn.disabled = true;
  answerRecorderWarning.textContent =
    "You may leave this page now. Your interview has been successfully uploaded.";
}
function videoUpload() {
  console.log("Video upload started");
  forceNextQuestionBtn.disabled = true;

  let date = new Date();
  let hours = date.getHours();
  let minutes = ("0" + date.getMinutes()).slice(-2); // Ensures two digits
  let seconds = ("0" + date.getSeconds()).slice(-2); // Ensures two digits
  const timestamp = `${hours}:${minutes}:${seconds}`;
  console.log(timestamp); // Outputs: "hh:mm:ss"
  const ansBlob = new Blob(vidChunks, { type: "video/mp4" });
  const fileName = `Answer_${currentVideo + 1}_${timestamp}_Advanced.mp4`;
  const file = new File([ansBlob], fileName, { type: "video/mp4" });
  console.log(`File name: ${file.name}`);
  const dateStamp = new Date().toLocaleDateString().replace(/\//g, ".");

  const params = {
    Bucket: "hoftfiles",
    Key: `AnswerVideos/${lastName}_${firstName}_${email}/${dateStamp}/${file.name}`,
    Body: file,
    ACL: "public-read",
  };
  console.log(params.Key);
  s3.upload(params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
      answerRecorderWarning.textContent = `Answer video uploaded successfully. Click on the 'Next Question' button to proceed.`;
      nextQuestionBtn.disabled = false;
    }
  });
}
let vidChunks = [];
let countdownInterval;

function startRecording() {
  mediaRecorder.ondataavailable = function (x) {
    vidChunks.push(x.data);
    console.log("Recording started");
  };
  answerRecorderWarning.textContent =
    "Recording started. Please answer the question.";
  mediaRecorder.start();
  console.log("Recording really started", mediaRecorder.state);
  // This is the countdown timer for the duration of the recording. Change the number of seconds according to Blair
  let countdown = answerDuration[videoKeys[currentVideo]];
  countdownInterval = setInterval(() => {
    countdown--;
    answerRecorderWarning.textContent = `Recording ${countdown} seconds left.`;
    if (countdown === 0) {
      clearInterval(countdownInterval);
      mediaRecorder.stop();
      answerRecorderWarning.textContent = `Recording stopped. Answer video is being uploaded. 
      Please do not leave this page until the upload is finished.`;
      forceNextQuestionBtn.disabled = true;
    }
  }, 1000);

  mediaRecorder.onstop = function () {
    videoUpload();
  };

  nextQuestionBtn.disabled = true;
}

questionVideo.addEventListener("ended", function () {
  nextQuestionBtn.disabled = false;
  questionVideo.pause();
  if (currentVideo === 9) {
    endofInterview();
  } else {
    startQuestionBtn.disabled = true;
    nextQuestionBtn.disabled = false;
    forceNextQuestionBtn.disabled = false;
    startRecording();
  }
});

nextQuestionBtn.addEventListener("click", function () {
  console.log("Next question button clicked");
  currentVideo++;
  if (currentVideo < videoSources.length) {
    document.getElementById("questionVideo").src = videoSources[currentVideo];
    startQuestionBtn.disabled = false;
    nextQuestionBtn.disabled = true;
    answerRecorderWarning.textContent =
      "Click on the 'Start Question' button to start the question video.";
  } else {
    console.log("All questions completed");
    questionVideo.pause();
    answerRecorderWarning.textContent =
      "All questions completed. Thank you for participating.";
    nextQuestionBtn.disabled = true;
  }
  questionHeader.textContent = `Question ${currentVideo + 1} of ${
    videoKeys.length
  }`;
  questionVideo.load();
});

questionVideo.addEventListener("loadedmetadata", function () {
  if (currentVideo === 9) {
    startQuestionBtn.disabled = true;
    nextQuestionBtn.disabled = true;

    questionVideo.play();
    answerRecorderWarning.textContent =
      "You may leave this page now. Your interview has been successfully uploaded.";
    extraContent.innerHTML = "";
    extraContent.style.display = "none";
  } else if (currentVideo === 8) {
    extraContent.style.display = "block";
    extraContent.innerHTML = '<img src="advancedStoryChoices.png">';
  } else {
    extraContent.style.display = "none";
  }
});

forceNextQuestionBtn.addEventListener("click", function () {
  console.log("Force next question button clicked");
  forceNextQuestionBtn.disabled = true;

  mediaRecorder.stop();
  countdown = 0;
  mediaRecorder.onstop = function () {
    videoUpload();
  };

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
loadUserMedia();
