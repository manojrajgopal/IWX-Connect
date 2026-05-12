import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings


def _master() -> bytes:
    return settings.ENCRYPTION_MASTER_KEY


def generate_data_key() -> bytes:
    return os.urandom(32)


def wrap_key(data_key: bytes) -> bytes:
    aes = AESGCM(_master())
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, data_key, None)
    return nonce + ct


def unwrap_key(wrapped: bytes) -> bytes:
    aes = AESGCM(_master())
    nonce, ct = wrapped[:12], wrapped[12:]
    return aes.decrypt(nonce, ct, None)


def encrypt(data_key: bytes, plaintext: bytes, aad: bytes | None = None) -> bytes:
    aes = AESGCM(data_key)
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, plaintext, aad)
    return nonce + ct


def decrypt(data_key: bytes, blob: bytes, aad: bytes | None = None) -> bytes:
    aes = AESGCM(data_key)
    nonce, ct = blob[:12], blob[12:]
    return aes.decrypt(nonce, ct, aad)
