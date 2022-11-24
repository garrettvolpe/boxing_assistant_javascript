

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const grid = new LandmarkGrid(landmarkContainer, {
    connectionColor: 0xff0000,
    range: 2,
    fitToGrid: true,
    labelSuffix: 'm',
    landmarkSize: 2,
    numCellsPerAxis: 4,
    showHidden: false,
    centered: true,
});

let landmarks;
let jab_stage;
let stance = "Orthodox"
let jab_counter = 0;
let straight_stage;
let straight_counter = 0;

function onResults(results) {
    if (!results.poseLandmarks) {
        grid.updateLandmarks([]);
        return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.segmentationMask, 0, 0,
        canvasElement.width, canvasElement.height);

    // canvasCtx.globalCompositeOperation = 'hard-light';
    // canvasCtx.fillStyle = '#000000';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    // canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 1 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: .01, radius: 1 });
    canvasCtx.restore();


    function calculate_angle(a, b, c) {
        let radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
        let angle = Math.abs(radians * 180.0 / Math.PI)

        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return angle
    }


    let r_wrist = [(results.poseLandmarks[16].x), (results.poseLandmarks[16].y)];
    let l_wrist = [(results.poseLandmarks[15].x), (results.poseLandmarks[15].y)];
    let r_elbow = [(results.poseLandmarks[14].x), (results.poseLandmarks[14].y)];
    let l_elbow = [(results.poseLandmarks[13].x), (results.poseLandmarks[13].y)];
    let r_shoulder = [(results.poseLandmarks[12].x), (results.poseLandmarks[12].y)];
    let l_shoulder = [(results.poseLandmarks[11].x), (results.poseLandmarks[11].y)];
    let r_hip = [(results.poseLandmarks[24].x), (results.poseLandmarks[24].y)];
    let l_hip = [(results.poseLandmarks[23].x), (results.poseLandmarks[23].y)];
    let r_pinky = [(results.poseLandmarks[18].x), (results.poseLandmarks[18].y)];
    let l_pinky = [(results.poseLandmarks[17].x), (results.poseLandmarks[17].y)];
    let nose = [(results.poseLandmarks[0].x), (results.poseLandmarks[0].y)];

    // get angles
    angle_left_elbow = calculate_angle(l_shoulder, l_elbow, l_wrist)
    angle_right_elbow = calculate_angle(r_shoulder, r_elbow, r_wrist)
    angle_rhip_rshoulder_rwrist = calculate_angle(r_hip, r_shoulder, r_wrist)
    angle_lhip_lshoulder_lwrist = calculate_angle(l_hip, l_shoulder, l_wrist)


    // left punch logic 
    if (angle_left_elbow < 60) {
        if (l_pinky[1] < l_shoulder[1]) {
            jab_stage = "Defense"
        }
    }
    if (angle_left_elbow > 110 && jab_stage === "Defense") {
        if (angle_lhip_lshoulder_lwrist > 70) {
            if (angle_right_elbow < 40) {
                if (stance == "Orthodox") {
                    jab_stage = "Offense"
                    jab_counter += 1
                }
            }
        }
    }

    // right punch logic 
    if (angle_right_elbow < 60) {
        if (r_pinky[1] < r_shoulder[1]) {
            straight_stage = "Defense"
        }
    }
    if (angle_right_elbow > 110 && straight_stage === "Defense") {
        if (angle_rhip_rshoulder_rwrist > 70) {
            if (angle_left_elbow < 40) {
                if (stance == "Orthodox") {
                    straight_stage = "Offense"
                    straight_counter += 1
                }
            }
        }
    }







    console.log(jab_counter)






    grid.updateLandmarks(results.poseWorldLandmarks);

}

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera.start();
