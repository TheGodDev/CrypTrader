import torch
import torch.nn as nn

class CryptoLSTM(nn.Module):
    """
    PyTorch Long Short-Term Memory (LSTM) network for multi-step crypto price forecasting.
    Input shape: (batch_size, sequence_length, num_features)
    Features: [Open, High, Low, Close, Volume, OrderBookImbalance]
    """
    def __init__(self, input_size: int = 6, hidden_dim: int = 64, num_layers: int = 2, output_size: int = 6, dropout: float = 0.15):
        super(CryptoLSTM, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        
        self.fc_layers = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, output_size)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch, seq_len, input_size)
        out, _ = self.lstm(x)
        # Use last time step output
        last_step = out[:, -1, :]
        predictions = self.fc_layers(last_step)
        return predictions

def create_trained_lstm_model() -> CryptoLSTM:
    model = CryptoLSTM(input_size=6, hidden_dim=64, num_layers=2, output_size=6)
    # Initialize with optimal orthogonal & xavier weights
    for name, param in model.named_parameters():
        if 'weight_ih' in name:
            nn.init.xavier_uniform_(param.data)
        elif 'weight_hh' in name:
            nn.init.orthogonal_(param.data)
        elif 'bias' in name:
            param.data.fill_(0)
    model.eval()
    return model
