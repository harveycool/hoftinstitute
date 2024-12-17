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
  "iqv1.MOV",
  "iqv2.MOV",
  "iqv3.MOV",
  "iqv4.MOV",
  "iqv5.MOV",
  "iqv6.MOV",
  "iqv7.MOV",
  "iqv8.MOV",
  "iqv9.MOV",
  "iqv10.MOV",
  "iqv11.MOV",
  "endofInterview.MOV",
];
``;
const answerDuration = {
  "iqv1.MOV": 6,
  "iqv2.MOV": 11,
  "iqv3.MOV": 16,
  "iqv4.MOV": 11,
  "iqv5.MOV": 31,
  "iqv6.MOV": 31,
  "iqv7.MOV": 31,
  "iqv8.MOV": 16,
  "iqv9.MOV": 11,
  "iqv10.MOV": 11,
  "iqv11.MOV": 61,
  "endofInterview.MOV": 0,
};

const videoSources = videoKeys.map((key) => {
  const params = {
    Bucket: "hoftfiles",
    Key: `questionVideos/intermediateQuestionVideos/${key}`,
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
  forceNextQuestionBtn.disabled = true;
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
  forceNextQuestionBtn.disabled = true;
  answerRecorderWarning.textContent = `Video is loading and it will start playing automatically when it is ready`;
});

questionVideo.addEventListener("error", function (event) {
  console.error("Video error: ", event);
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
  const fileName = `Answer_${currentVideo + 1}_${timestamp}_Intermediate.mp4`;
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

      vidChunks = [];
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
  if (currentVideo === 11) {
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
  if (currentVideo === 11) {
    startQuestionBtn.disabled = true;
    nextQuestionBtn.disabled = true;

    questionVideo.play();
    answerRecorderWarning.textContent =
      "You may leave this page now. Your interview has been successfully uploaded.";
    extraContent.innerHTML = "";
    extraContent.style.display = "none";
  } else if (currentVideo === 4) {
    extraContent.style.display = "block";
    extraContent.innerHTML = '<img src="intermediateBoyPhoto.png">';
  } else if (currentVideo === 5) {
    extraContent.style.display = "block";
    extraContent.innerHTML = '<img src="intermediateBoyPhoto.png">';
  } else if (currentVideo === 10) {
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
