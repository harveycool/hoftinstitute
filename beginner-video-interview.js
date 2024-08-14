const questionVideo = document.getElementById("questionVideo");
const answerRecorder = document.getElementById("answerRecorder");
const startQuestionBtn = document.getElementById("startQuestion");
const nextQuestionBtn = document.getElementById("nextQuestion");
const answerRecorderWarning = document.getElementById("answerRecorderWarning");

//Getting all the personal data from the main page
const firstName = sessionStorage.getItem("firstName");
const lastName = sessionStorage.getItem("lastName");
const email = sessionStorage.getItem("email");
const phone = sessionStorage.getItem("phoneNumber");

// //Progress Bar code is not working. Fix later
// const uploadProgressBar = document.getElementById("uploadProgressBar");
// const progressPercentageLabel = document.getElementById(
//   "progressPercentageLabel"
// );
// const progressBarLabel = document.querySelector(
//   `label[for='${uploadProgressBar.id}']`
// );
// uploadProgressBar.style.display = "none";
// progressPercentageLabel.style.display = "none";
// progressBarLabel.style.display = "none";

AWS.config.update({
  accessKeyId: "DO00JV9GL7CYLW8G8E3D",
  secretAccessKey: "A+h2NgptkKly2VYNZxz7sRX/bfTWDDQkl1MWVMzwTFU",
});

const spacesEndpoint = new AWS.Endpoint("nyc3.digitaloceanspaces.com");

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
});

const videoKeys = [
  "bqv1.MOV",
  "bqv2.MOV",
  "bqv3.MOV",
  "bqv4.MOV",
  "bqv5.MOV",
  "bqv6.MOV",
  "bqv7.MOV",
  "bqv8.MOV",
  "bqv9.MOV",
  "bqv10.MOV",
  "bqv12.MOV",
  "bqv13.MOV",
  "bqv14.MOV",
  "endofInterview.MOV",
];
``;
const answerDuration = {
  "bqv1.MOV": 5,
  "bqv2.MOV": 10,
  "bqv3.MOV": 5,
  "bqv4.MOV": 5,
  "bqv5.MOV": 15,
  "bqv6.MOV": 15,
  "bqv7.MOV": 10,
  "bqv8.MOV": 15,
  "bqv9.MOV": 15,
  "bqv10.MOV": 10,
  "bqv12.MOV": 30,
  "bqv13.MOV": 30,
  "bqv14.MOV": 30,
  "endofInterview.MOV": 0,
};

const videoSources = videoKeys.map((key) => {
  const params = {
    Bucket: "hoftfiles",
    Key: `questionVideos/beginnerQuestionVideos/${key}`,
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
  questionVideo.load();
}
// Add this to your JavaScript file
function startAnswerCountdown(timeInSeconds) {
  var countdownElement = document.getElementById("answerCountdown");
  var countdown = timeInSeconds;

  // Update the countdown every second
  var intervalId = setInterval(function () {
    countdown--;
    countdownElement.innerText = countdown + " seconds remaining";

    if (countdown <= 0) {
      clearInterval(intervalId);
      countdownElement.innerText = "Time's up!";
    }
  }, 1000);
}

// Call this function when the answer recorder starts, for example:
// startAnswerCountdown(60); // 60 seconds countdown
startQuestionBtn.addEventListener("click", function () {
  questionVideo.play();
  startQuestionBtn.disabled = true;
  answerRecorderWarning.textContent = `Video is loading and it will start playing automactically when it is ready`;
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
function startRecording() {
  let vidChunks = [];
  console.log("Recording started");
  answerRecorderWarning.textContent =
    "Recording started. Please answer the question.";
  const mediaRecorder = new MediaRecorder(answerRecorder.srcObject);
  mediaRecorder.start();
  console.log("Recording really started", mediaRecorder.state);
  // This is the countdown timer for the duration of the recording. Change the number of seconds according to Blair
  let countdown = answerDuration[videoKeys[currentVideo]];
  const countdownInterval = setInterval(() => {
    countdown--;
    answerRecorderWarning.textContent = `Recording ${countdown} seconds left.`;
    if (countdown === 0) {
      clearInterval(countdownInterval);
      mediaRecorder.stop();
      answerRecorderWarning.textContent = `Recording stopped. Answer video is being uploaded. 
      Please do not leave this page until the upload is finsihed.`;
    }
  }, 1000);

  mediaRecorder.ondataavailable = function (x) {
    vidChunks.push(x.data);
  };
  mediaRecorder.onstop = function () {
    let date = new Date();
    let hours = date.getHours();
    let minutes = ("0" + date.getMinutes()).slice(-2); // Ensures two digits
    let seconds = ("0" + date.getSeconds()).slice(-2); // Ensures two digits
    const timestamp = `${hours}:${minutes}:${seconds}`;
    console.log(timestamp); // Outputs: "hh:mm:ss"
    const ansBlob = new Blob(vidChunks, { type: "video/mp4" });
    const fileName = `Answer_${currentVideo + 1}_${timestamp}.mp4`;
    const file = new File([ansBlob], fileName, { type: "video/mp4" });
    console.log(`File name: ${file.name}`);
    const dateStamp = new Date().toLocaleDateString().replace(/\//g, ".");

    const params = {
      Bucket: "hoftfiles",
      Key: `AnswerVideos/${lastName}_${firstName}_${phone}_${email}/${dateStamp}/${file.name}`,
      Body: file,
      ACL: "public-read",
    };
    console.log(params.Key);
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
        nextQuestionBtn.disabled = false;
      }
    });
  };

  setTimeout(() => {
    console.log("Inside setTimeout");
    mediaRecorder.stop();
    console.log("After setTimeout");
  }, 10000);
  nextQuestionBtn.disabled = true;
}

questionVideo.addEventListener("ended", function () {
  nextQuestionBtn.disabled = false;
  questionVideo.pause();
  answerRecorderWarning.textContent = "The recording will start in 5 seconds.";
  startQuestionBtn.disabled = true;
  nextQuestionBtn.disabled = false;
  startRecording();
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

  questionVideo.load();
});

loadUserMedia();
