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

const init = async () => {
  await stackml.init({
    accessKeyId: ACCESS_KEY
  });
};

// Load image chosen in the web page
loadImage = () => {
  const input = document.querySelector("#image-input");
  const fReader = new FileReader();
  fReader.readAsDataURL(input.files[0]);
  fReader.onloadend = event => {
    const source_img = document.querySelector("#source");
    source_img.src = event.target.result;
  };
};

// Censor the detected faces with most appropriate emoji
onSubmit = async () => {
  const model = await stackml.faceExpression(callbackLoad);
  const source_img = document.querySelector("#source");
  const res_img = document.querySelector("#result");

  function callbackLoad() {
    console.log("callback after face landmark detection model is loaded!");
  }

  // make prediction with the image
  model.detect(source_img, callbackPredict);

  // callback after prediction
  function callbackPredict(err, results) {
    console.log(results);

    // draw output keypoints in the image

    const sourceWidth = source_img.width;
    const sourceHeight = source_img.height;

    res_img.width = sourceWidth;
    res_img.height = sourceHeight;
    res_img.style.height = sourceHeight + "px";
    res_img.style.width = sourceWidth + "px";

    const sourceNaturalWidth = source_img.naturalWidth;
    const sourceNaturalHeight = source_img.naturalHeight;

    const displayToNaturalWidthR = sourceWidth / sourceNaturalWidth;
    const displayToNaturalHeightR = sourceHeight / sourceNaturalHeight;

    const ctx = res_img.getContext("2d");

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

    const { outputs } = results;
    const outputLen = outputs.length;
    let maxP;
    for (let i = 0; i < outputLen; i++) {
      const output = outputs[i];
      maxP = 0;
      //Find most suitable expression i.e having highest probability
      for (let j = 0; j < 7; j++) {
        if (maxP < output.expressions[j].probability) {
          emoji = output.expressions[j].expression;
          maxP = output.expressions[j].probability;
        }
      }

      const boxWidth = output.detection.box.width;
      const boxHeight = output.detection.box.height;

      let censorX =
        (output.detection.box.x + boxWidth / 2) * displayToNaturalWidthR;
      let censorY =
        (output.detection.box.y + boxHeight) * displayToNaturalHeightR;

      ctx.font = `${boxHeight * displayToNaturalHeightR}px Arial`;
      ctx.fillText(express[emoji], censorX, censorY);
    }
  }
};

init();
