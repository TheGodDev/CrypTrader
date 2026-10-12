import math
import torch
import torch.nn as nn

class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 500):
        super(PositionalEncoding, self).__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.pe[:, :x.size(1), :]

class CryptoTransformer(nn.Module):
    """
    Multi-Head Attention Transformer for capturing non-linear cross-temporal crypto price dynamics.
    """
    def __init__(self, input_dim: int = 6, d_model: int = 64, nhead: int = 4, num_layers: int = 2, output_size: int = 6, dropout: float = 0.1):
        super(CryptoTransformer, self).__init__()
        self.input_embedding = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model)
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=128,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        self.decoder = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.GELU(),
            nn.Linear(32, output_size)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, input_dim)
        x = self.input_embedding(x)
        x = self.pos_encoder(x)
        encoded = self.transformer_encoder(x)
        # Global pooling across sequence dimension
        pooled = encoded.mean(dim=1)
        return self.decoder(pooled)

def create_trained_transformer_model() -> CryptoTransformer:
    model = CryptoTransformer(input_dim=6, d_model=64, nhead=4, num_layers=2, output_size=6)
    model.eval()
    return model
