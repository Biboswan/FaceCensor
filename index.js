const ACCESS_KEY = "a4b348a72cb9f3d86663808f9b43c6aa";
const express = {
  neutral: "😐",
  happy: "😃",
  sad: "😔",
  angry: "😠",
  fearful: "😨",
  disgusted: "😫",
  surprised: "😲"
};
const noOfExpress = Object.keys(express).length;

const init = async () => {
  await stackml.init({
    accessKeyId: ACCESS_KEY
  });
};

let outputs, displayToNaturalWidthR, displayToNaturalHeightR, ctx;

// Load image chosen in the web page
loadImage = () => {
  const input = document.querySelector("#image-input");
  const fReader = new FileReader();
  fReader.readAsDataURL(input.files[0]);
  fReader.onloadend = event => {
    document.querySelector("#detect-faces-btn").disabled = false;
    // Cleaning existing face censor buttons
    document.querySelectorAll(".censor-btn").forEach(el => el.remove());
    document.querySelector("#source").src = event.target.result;
    document
      .querySelector("#source-container")
      .removeEventListener("click", handleSourceContainerClick);
  };
};

addButtonToFaces = outputs => {
  const outputLen = outputs.length;

  for (let i = 0; i < outputLen; i++) {
    const output = outputs[i];
    const boxWidth = output.detection.box.width;
    const boxHeight = output.detection.box.height;
    const censorX =
      (output.detection.box.x + boxWidth / 2) * displayToNaturalWidthR;
    const censorY =
      (output.detection.box.y + boxHeight / 2) * displayToNaturalHeightR;

    const btn = document.createElement("button");
    btn.classList.add("censor-btn");
    btn.id = i;
    btn.style.left = censorX + "px";
    btn.style.top = censorY + "px";
    btn.style.width = boxWidth * displayToNaturalWidthR + "px";
    btn.innerHTML = "censor";
    document.querySelector("#source-container").append(btn);
  }
};

// Censor the detected faces with most appropriate emoji
onSubmit = async () => {
  const censorAllBtn = document.querySelector("#censor-all-btn");
  censorAllBtn.disabled = true;
  const model = await stackml.faceExpression(callbackLoad);

  function callbackLoad() {
    console.log("callback after face landmark detection model is loaded!");
  }

  const source_img = document.querySelector("#source");
  // make prediction with the image
  model.detect(source_img, callbackPredict);

  // callback after prediction
};

callbackPredict = (err, results) => {
  const source_img = document.querySelector("#source");
  const res_img = document.querySelector("#result");

  console.log(results);

  //Event delegating for censor face buttons
  const source_container = document.querySelector("#source-container");
  source_container.addEventListener("click", handleSourceContainerClick);

  const censorAllBtn = document.querySelector("#censor-all-btn");
  outputs = results.outputs;

  censorAllBtn.disabled = false;
  censorAllBtn.addEventListener("click", handleCensorAllBtnClick);

  // draw output keypoints in the image

  const sourceWidth = source_img.width;
  const sourceHeight = source_img.height;

  res_img.width = sourceWidth;
  res_img.height = sourceHeight;
  res_img.style.height = sourceHeight + "px";
  res_img.style.width = sourceWidth + "px";

  const sourceNaturalWidth = source_img.naturalWidth;
  const sourceNaturalHeight = source_img.naturalHeight;

  displayToNaturalWidthR = sourceWidth / sourceNaturalWidth;
  displayToNaturalHeightR = sourceHeight / sourceNaturalHeight;

  addButtonToFaces(outputs);

  ctx = res_img.getContext("2d");

  ctx.drawImage(
    source_img,
    0,
    0,
    sourceNaturalWidth,
    sourceNaturalHeight,
    0,
    0,
    sourceWidth,
    sourceHeight
  );
  ctx.textAlign = "center";
};

handleSourceContainerClick = e => {
  console.log(e.target.id);
  if (e.target.tagName == "BUTTON") {
    censorFace(e.target.id);
  }
};

handleCensorAllBtnClick = () => {
  const outputLen = outputs.length;
  for (let i = 0; i < outputLen; i++) {
    censorFace(i);
  }
};

censorFace = i => {
  const output = outputs[i];

  let maxP = 0,
    emoji;
  //Find most suitable expression i.e having highest probability
  for (let j = 0; j < noOfExpress; j++) {
    if (maxP < output.expressions[j].probability) {
      emoji = output.expressions[j].expression;
      maxP = output.expressions[j].probability;
    }
  }

  const boxWidth = output.detection.box.width;
  const boxHeight = output.detection.box.height;

  const censorX =
    (output.detection.box.x + boxWidth / 2) * displayToNaturalWidthR;
  const censorY =
    (output.detection.box.y + boxHeight) * displayToNaturalHeightR;

  ctx.font = `${boxHeight * displayToNaturalHeightR}px Arial`;
  ctx.fillText(express[emoji], censorX, censorY);
};

init();
