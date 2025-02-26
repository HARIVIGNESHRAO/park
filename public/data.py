# import librosa
# import numpy as np
# import os
# import joblib
# import tensorflow as tf
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler, LabelEncoder
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import Dense, Dropout
# from tensorflow.keras.utils import to_categorical
#
# # Check GPU availability
# print("Num GPUs Available:", len(tf.config.list_physical_devices('GPU')))
# if tf.config.list_physical_devices('GPU'):
#     print("✅ Using GPU for training.")
# else:
#     print("⚠️ No GPU found, using CPU.")
#
# # Function to extract features from audio
# def extract_features(file_path):
#     try:
#         audio, sample_rate = librosa.load(file_path, res_type='kaiser_fast', duration=3)
#         mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
#         mfccs_mean = np.mean(mfccs.T, axis=0)
#
#         chroma = librosa.feature.chroma_stft(y=audio, sr=sample_rate)
#         chroma_mean = np.mean(chroma.T, axis=0)
#
#         mel = librosa.feature.melspectrogram(y=audio, sr=sample_rate)
#         mel_mean = np.mean(mel.T, axis=0)
#
#         contrast = librosa.feature.spectral_contrast(y=audio, sr=sample_rate)
#         contrast_mean = np.mean(contrast.T, axis=0)
#
#         features = np.hstack([mfccs_mean, chroma_mean, mel_mean, contrast_mean])
#     except Exception as e:
#         print(f"❌ Error processing {file_path}: {str(e)}")
#         return None
#     return features
#
# # Load dataset
# def load_data(dataset_path):
#     X, y = [], []
#     emotions = {
#         '01': 'neutral', '02': 'calm', '03': 'happy', '04': 'sad',
#         '05': 'angry', '06': 'fearful', '07': 'disgust', '08': 'surprised'
#     }
#
#     for root, _, files in os.walk(dataset_path):
#         for file in files:
#             if file.endswith('.wav'):
#                 file_path = os.path.join(root, file)
#                 emotion_code = file.split('-')[2]  # Extract emotion code
#                 emotion = emotions.get(emotion_code, 'unknown')
#
#                 features = extract_features(file_path)
#                 if features is not None:
#                     X.append(features)
#                     y.append(emotion)
#
#     return np.array(X), np.array(y)
#
# # Set dataset path
# dataset_path = r"C:\Users\hariv\Downloads\Audio_Speech_Actors_01-24\Actor_24"
# X, y = load_data(dataset_path)
#
# # Preprocessing
# scaler = StandardScaler()
# X = scaler.fit_transform(X)
#
# # Encode labels
# label_encoder = LabelEncoder()
# y_encoded = label_encoder.fit_transform(y)
# y_categorical = to_categorical(y_encoded)
#
# # Train-test split
# X_train, X_test, y_train, y_test = train_test_split(X, y_categorical, test_size=0.2, random_state=42)
#
# # Build Keras model
# model = Sequential([
#     Dense(256, activation='relu', input_shape=(X_train.shape[1],)),
#     Dropout(0.3),
#     Dense(128, activation='relu'),
#     Dropout(0.2),
#     Dense(len(label_encoder.classes_), activation='softmax')
# ])
#
# model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
#
# # Train model
# history = model.fit(
#     X_train, y_train,
#     epochs=50,
#     batch_size=32,
#     validation_data=(X_test, y_test)
# )
#
# # Print completion message
# print(f"✅ Training completed! {len(history.epoch)} epochs trained successfully.")
#
# # Save model and preprocessing objects
# model.save("emotion_detection_model.h5")
# joblib.dump(scaler, 'scaler.pkl')
# joblib.dump(label_encoder, 'label_encoder.pkl')
#
# print("✅ Model and preprocessing objects saved.")
import librosa
import numpy as np
import joblib
from tensorflow.keras.models import load_model
import sys

# Load the trained model
# Check if model is loaded correctly
try:
    model = load_model("emotion_detection_model.h5")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {str(e)}")
    sys.exit(1)


# Load the scaler and label encoder
scaler = joblib.load("scaler.pkl")
label_encoder = joblib.load("label_encoder.pkl")

# Function to extract features from an audio file
def extract_features(file_path):
    try:
        audio, sample_rate = librosa.load(file_path, res_type='kaiser_fast', duration=3)
        mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
        mfccs_mean = np.mean(mfccs.T, axis=0)

        chroma = librosa.feature.chroma_stft(y=audio, sr=sample_rate)
        chroma_mean = np.mean(chroma.T, axis=0)

        mel = librosa.feature.melspectrogram(y=audio, sr=sample_rate)
        mel_mean = np.mean(mel.T, axis=0)

        contrast = librosa.feature.spectral_contrast(y=audio, sr=sample_rate)
        contrast_mean = np.mean(contrast.T, axis=0)

        features = np.hstack([mfccs_mean, chroma_mean, mel_mean, contrast_mean])
        return features
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return None

# Function to predict emotion from an audio file
def predict_emotion(audio_path):
    # Extract features
    features = extract_features(audio_path)
    if features is None:
        return "Error extracting features"

    # Scale features (same as training)
    features = scaler.transform([features])  # Ensure it matches training data

    # Make prediction
    prediction = model.predict(features)
    predicted_label = np.argmax(prediction)

    # Convert label index to actual emotion
    emotion = label_encoder.inverse_transform([predicted_label])[0]
    return emotion

# Run prediction if script is executed with an audio file argument

if __name__ == "__main__":
    # Check if an audio file path is provided via command line
    if len(sys.argv) > 1:
        test_audio = sys.argv[1]
    else:
        # Default test file (modify the path if necessary)
        test_audio = r"C:\Users\hariv\Downloads\Audio_Speech_Actors_01-24\Actor_03\03-01-06-01-02-01-03.wav"

    print(f"🎵 Testing audio file: {test_audio}")

    # Predict emotion
    predicted_emotion = predict_emotion(test_audio)
    print(f"🗣️ Predicted Emotion: {predicted_emotion}")

