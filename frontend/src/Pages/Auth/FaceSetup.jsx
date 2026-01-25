import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import mlService from '../../services/mlService';
import api from '../../services/api';
import Button from '../../components/Common/Button';
import Alert from '../../components/Common/Alert';
import './FaceSetup.css';

const FaceSetup = () => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?. faceDescriptor) {
      navigate('/student');
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // ✅ NEW: Handle video element setup when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      
      const playVideo = async () => {
        try {
          await videoRef.current.play();
          console.log('Video started playing');
        } catch (err) {
          console.error('Error playing video:', err);
          setStatus('error');
          setMessage('Failed to start video. Please try again.');
        }
      };
      
      videoRef.current.addEventListener('loadedmetadata', playVideo);
      
      return () => {
        if (videoRef.current) {
          videoRef.current. removeEventListener('loadedmetadata', playVideo);
        }
      };
    }
  }, [stream]);

  const startWebcam = async () => {
    try {
      setStatus('loading');
      setMessage('Accessing webcam...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      setMessage('Loading face detection models...');
      await mlService.loadModels();

      setStream(mediaStream);
      setStatus('idle');
      setMessage('Position your face in the center and click "Capture Face"');
    } catch (error) {
      console.error('Error starting webcam:', error);
      setStatus('error');
      setMessage('Failed to access webcam. Please allow camera permissions.');
    }
  };

  const captureFace = async () => {
    try {
      setStatus('capturing');
      setMessage('Detecting face...');

      const faceDescriptor = await mlService.captureFaceDescriptor(videoRef.current);

      if (! faceDescriptor) {
        setStatus('error');
        setMessage('No face detected. Please ensure your face is clearly visible and try again.');
        return;
      }

      setMessage('Saving face data...');

      const response = await api.put('/auth/face-descriptor', {
        faceDescriptor
      });

      if (response. data.success) {
        updateUser(response.data.user);
        setStatus('success');
        setMessage('Face registered successfully!  Redirecting.. .');

        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        setTimeout(() => {
          navigate('/student');
        }, 2000);
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to save face data');
    }
  };

  const skipSetup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/student');
  };

  return (
    <div className="face-setup-container">
      <div className="face-setup-card">
        <h1>Face Recognition Setup</h1>
        <p className="face-setup-description">
          Set up face recognition for secure exam proctoring. This is required to attempt exams.
        </p>

        {message && (
          <Alert 
            type={status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}
            message={message}
          />
        )}

        <div className="face-setup-video-container">
          {! stream ? (
            <div className="face-setup-placeholder">
              <span className="face-setup-icon">📷</span>
              <p>Click "Start Webcam" to begin</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="face-setup-video"
            />
          )}
        </div>

        <div className="face-setup-instructions">
          <h3>Instructions: </h3>
          <ul>
            <li>✓ Ensure good lighting</li>
            <li>✓ Position your face in the center</li>
            <li>✓ Look directly at the camera</li>
            <li>✓ Remove glasses if possible</li>
            <li>✓ Keep a neutral expression</li>
          </ul>
        </div>

        <div className="face-setup-actions">
          {! stream ? (
            <Button
              variant="primary"
              size="large"
              onClick={startWebcam}
              loading={status === 'loading'}
            >
              Start Webcam
            </Button>
          ) : (
            <>
              <Button
                variant="success"
                size="large"
                onClick={captureFace}
                loading={status === 'capturing'}
                disabled={status === 'success'}
              >
                Capture Face
              </Button>
              <Button
                variant="secondary"
                size="large"
                onClick={() => {
                  stream.getTracks().forEach(track => track.stop());
                  setStream(null);
                  setMessage('');
                  setStatus('idle');
                }}
                disabled={status === 'capturing' || status === 'success'}
              >
                Retake
              </Button>
            </>
          )}
        </div>

        <div className="face-setup-skip">
          <button onClick={skipSetup} className="skip-button">
            Skip for now (You won't be able to attempt exams)
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceSetup;