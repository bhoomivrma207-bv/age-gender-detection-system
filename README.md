# Real-Time Age and Gender Detection System

A computer vision-based application that detects human faces 
in real time and predicts age range and gender using 
pre-trained deep learning models.

The system uses OpenCV DNN module and Caffe models 
for inference through webcam input.

---

## Tech Stack
- Python
- OpenCV
- Deep Learning (Caffe Models)
- NumPy

---

## Features
- Real-time face detection
- Age range classification
- Gender classification
- Live webcam prediction
- Bounding box visualization

---

## How It Works
1. Face detection using OpenCV DNN
2. Extracted face region passed to:
   - Age prediction model
   - Gender prediction model
3. Results displayed on live video stream

---

## How to Run

1. Install dependencies:
   pip install -r requirements.txt

2. Run the application:
   python main.py

Press 'q' to exit the webcam.

---
## Model Files

Due to GitHub file size limitations, the pre-trained Caffe model files 
(.caffemodel) are not included in this repository.

Please download the following models and place them in the project directory:

- age_net.caffemodel
- gender_net.caffemodel
- opencv_face_detector_uint8.pb

You can download them from the official OpenCV repository:
https://github.com/spmallick/learnopencv/tree/master/AgeGender
