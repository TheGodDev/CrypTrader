import os
import shutil
import torch
import numpy as np
import onnx
import onnxruntime as ort

from models.lstm_model import CryptoLSTM, create_trained_lstm_model
from models.transformer_model import CryptoTransformer, create_trained_transformer_model

def export_onnx_models():
    print("🚀 Initializing PyTorch models for ONNX export...")
    
    # 1. Export LSTM Model
    lstm_model = create_trained_lstm_model()
    lstm_model.eval()
    
    # Dummy input: (batch_size=1, sequence_length=30, num_features=6)
    dummy_input = torch.randn(1, 30, 6, dtype=torch.float32)
    
    lstm_onnx_path = os.path.join(os.path.dirname(__file__), "model_lstm.onnx")
    
    torch.onnx.export(
        lstm_model,
        dummy_input,
        lstm_onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input_sequence'],
        output_names=['predicted_trajectory'],
        dynamic_axes={
            'input_sequence': {0: 'batch_size', 1: 'sequence_length'},
            'predicted_trajectory': {0: 'batch_size'}
        }
    )
    print(f"✅ PyTorch LSTM successfully exported to ONNX: {lstm_onnx_path}")
    
    # Verify with onnx
    onnx_model = onnx.load(lstm_onnx_path)
    onnx.checker.check_model(onnx_model)
    print("✅ ONNX model structure validated with onnx.checker.")
    
    # Verify with onnxruntime
    session = ort.InferenceSession(lstm_onnx_path)
    inputs = {session.get_inputs()[0].name: dummy_input.numpy()}
    outputs = session.run(None, inputs)
    print(f"✅ ONNX Runtime inference test passed. Output shape: {outputs[0].shape}")
    
    # Copy to web app public directory for browser ONNX runtime
    public_target = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "models", "model_lstm.onnx")
    shutil.copyfile(lstm_onnx_path, public_target)
    print(f"✅ Model copied to browser static asset directory: {public_target}")

if __name__ == "__main__":
    export_onnx_models()
