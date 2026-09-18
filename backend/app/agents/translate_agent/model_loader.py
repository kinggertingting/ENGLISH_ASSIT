import os
import torch
from dotenv import load_dotenv
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
)

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "Qwen/Qwen2.5-7B-Instruct")

_shared_model = None
_shared_tokenizer = None


def get_shared_model_and_tokenizer(model_name: str = None):
    """
    Singleton function to load and cache the LLM model and tokenizer.
    Ensures that only ONE instance of the model is loaded in memory.
    Supports GPU (4-bit bitsandbytes) and automatic CPU fallback.
    """
    global _shared_model, _shared_tokenizer

    if model_name is None:
        model_name = os.getenv("MODEL_NAME", MODEL_NAME)

    if _shared_model is not None and _shared_tokenizer is not None:
        return _shared_model, _shared_tokenizer

    print(f"Loading shared LLM model: {model_name}...")

    _shared_tokenizer = AutoTokenizer.from_pretrained(model_name)

    if torch.cuda.is_available():
        print("CUDA GPU detected. Loading model with 4-bit quantization...")
        if torch.cuda.is_bf16_supported():
            compute_dtype = torch.bfloat16
        else:
            compute_dtype = torch.float16

        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=compute_dtype,
            bnb_4bit_use_double_quant=True,
        )

        _shared_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=quantization_config,
            device_map="auto",
            torch_dtype="auto",
        )
    else:
        print("CUDA GPU is not available. Falling back to CPU mode...")
        _shared_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="cpu",
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True,
        )

    _shared_model.eval()

    print("Shared LLM model loaded successfully.")
    return _shared_model, _shared_tokenizer
