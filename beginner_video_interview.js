const questionVideo = document.getElementById("questionVideo");
const answerRecorder = document.getElementById("answerRecorder");
const startQuestionBtn = document.getElementById("startQuestion");
const nextQuestionBtn = document.getElementById("nextQuestion");
const answerRecorderWarning = document.getElementById("answerRecorderWarning");

AWS.config.update({
  accessKeyId: 'DO00YZE99PML9HXFV7JV',
  secretAccessKey: 'G3Qp8YArA3Sb9i1VFDhxATVcqV524NuZHBoZFVhsxmU'
});
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3 ({
  endpoint: spacesEndpoint,
});

const videoKeys = [
  'bv1.mp4',
  'bv2.mp4',
];

const videoSources = videoKeys.map(key =>{const params ={
  Bucket: 'hoftfiles',
  Key: key,
  Expires: 60*10
};
return s3.getSignedUrl('getObject', params);
});

console.log(videoSources);

// let videoSources = ["https://hoftfiles.nyc3.digitaloceanspaces.com/bv1.mp4", 
//   "https://hoftfiles.nyc3.digitaloceanspaces.com/bv2.mp4",
//   "https://hoftfiles.nyc3.digitaloceanspaces.com/bv2.mp4"];
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
  questionVideo.play();
});

function startRecording() {
  let vidChunks = [];
  console.log("Recording started");
  answerRecorderWarning.textContent =
    "Recording started. Please answer the question.";
  const mediaRecorder = new MediaRecorder(answerRecorder.srcObject);
  mediaRecorder.start();
  console.log("Recording really started", mediaRecorder.state);
  if (mediaRecorder.state !== "inactive") {
    console.log("Media recorder is active");
  } else {
    console.log("Recording is actually working");
  }
  console.log("Before setTimeout");
  mediaRecorder.ondataavailable = function (x) {
    vidChunks.push(x.data);
  };
  mediaRecorder.onstop = function () {
    const ansBlob = new Blob(vidChunks, { type: "video/mp4" });
    const file = new File([ansBlob], "AnsVideo_"+ currentVideo+1 + ".mp4", {type: "video/mp4"});

    const params = {
      Bucket: "hoftfiles",
      Key: 'AnswerVideos/${timestamp}/${file.name}',
      Body: file,
      ACL: 'public-read'
    }

    s3.upload(params, function(err, data) {
      if(err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });
    //This is for downloading the video
    // const a = document.createElement("a"); 
    // a.href = URL.createObjectURL(ansBlob);
    // a.download = "answer video for question" + currentVideo + ".webm";
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
  };
  setTimeout(() => {
    console.log("Inside setTimeout");
    mediaRecorder.stop();
    console.log("After setTimeout");
  }, 5000);
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
  //document.getElementById("questionVideo").src = "bv2.mp4";
  questionVideo.load();
  //   if (questionVideo.getAttribute("src") === "bv2.mp4") {
  //     console.log("Second video URL changed");
  //   } else {
  //     console.log("Second video URL not changed");
  //   }
  //   console.log(questionVideo); // Should log the video element
  //   questionVideo.src = "bv2.mp4";
  //   console.log(questionVideo.src); // Should log the new src
});

loadUserMedia();
