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
