// Navigation
function navigateTo(page) {
    window.location.href = page;
}

function navigateHome() {
    window.location.href = 'home.html';
}

// AES-256 Encryption using CryptoJS
function encrypt(text, key) {
    try {
        const encrypted = CryptoJS.AES.encrypt(text, key).toString();
        return encrypted;
    } catch (e) {
        throw new Error('Encryption failed');
    }
}

function decrypt(encryptedText, key) {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        throw new Error('Decryption failed - invalid key or corrupted data');
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 15;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 10;
    return Math.min(strength, 100);
}

function updatePasswordStrength() {
    const password = document.getElementById('keyInput').value;
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const encodeBtn = document.getElementById('encodeBtn');
    
    const strength = checkPasswordStrength(password);
    
    strengthBar.style.width = strength + '%';
    
    if (strength < 50) {
        strengthBar.style.background = '#e74c3c';
        strengthText.textContent = 'Weak Password';
        strengthText.style.color = '#e74c3c';
        encodeBtn.disabled = true;
    } else if (strength < 75) {
        strengthBar.style.background = '#f39c12';
        strengthText.textContent = 'Medium Password';
        strengthText.style.color = '#f39c12';
        encodeBtn.disabled = false;
    } else {
        strengthBar.style.background = '#27ae60';
        strengthText.textContent = 'Strong Password';
        strengthText.style.color = '#27ae60';
        encodeBtn.disabled = false;
    }
}

function updateCharCount() {
    const message = document.getElementById('messageInput').value;
    document.getElementById('charCount').textContent = message.length;
    
    const encodeBtn = document.getElementById('encodeBtn');
    if (message.length === 0) {
        encodeBtn.disabled = true;
    }
}

function showProcessStep(container, step, status = 'processing') {
    const stepDiv = document.createElement('div');
    stepDiv.className = `process-step ${status}`;
    stepDiv.innerHTML = step;
    document.getElementById(container).appendChild(stepDiv);
}

function previewImage(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" onclick="showImageModal('${e.target.result}')">`;
        };
        reader.readAsDataURL(file);
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function showImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <span class="close-modal" onclick="closeImageModal()">&times;</span>
        <div class="modal-content">
            <img src="${src}" alt="Full Size Image">
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    };
}

function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.remove();
    }
}

// Convert string to binary
function stringToBinary(str) {
    return str.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
}

// Convert binary to string
function binaryToString(binary) {
    let result = '';
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substr(i, 8);
        if (byte.length === 8) {
            result += String.fromCharCode(parseInt(byte, 2));
        }
    }
    return result;
}

function hideMessage() {
    const imageInput = document.getElementById('imageInput');
    const messageInput = document.getElementById('messageInput');
    const keyInput = document.getElementById('keyInput');
    
    if (!imageInput.files[0] || !messageInput.value || !keyInput.value) {
        alert('⚠️ Please fill all required fields');
        return;
    }

    const file = imageInput.files[0];
    const message = messageInput.value;
    const key = keyInput.value;
    
    document.getElementById('processSteps').innerHTML = '';
    
    showProcessStep('processSteps', '🔐 Encrypting message with AES-256...');
    
    setTimeout(() => {
        try {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    showProcessStep('processSteps', '🖼️ Processing image data...');
                    
                    setTimeout(() => {
                        const canvas = document.getElementById('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        
                        const maxCapacity = Math.floor(data.length / 4) * 3;
                        const encryptedMessage = encrypt(message, key);
                        const binaryMessage = stringToBinary(encryptedMessage + '###END###');
                        
                        if (binaryMessage.length > maxCapacity) {
                            showProcessStep('processSteps', '❌ Error: Message too large for this image', 'error');
                            return;
                        }
                        
                        showProcessStep('processSteps', '🔍 Hiding encrypted data in image pixels...');
                        
                        setTimeout(() => {
                            let messageIndex = 0;
                            for (let i = 0; i < data.length && messageIndex < binaryMessage.length; i += 4) {
                                for (let channel = 0; channel < 3 && messageIndex < binaryMessage.length; channel++) {
                                    data[i + channel] = (data[i + channel] & 0xFE) | parseInt(binaryMessage[messageIndex]);
                                    messageIndex++;
                                }
                            }
                            
                            ctx.putImageData(imageData, 0, 0);
                            
                            showProcessStep('processSteps', '✅ Creating secure image file...', 'success');
                            
                            canvas.toBlob(function(blob) {
                                const url = URL.createObjectURL(blob);
                                const downloadLink = document.getElementById('downloadLink');
                                downloadLink.innerHTML = `
                                    <div style="text-align: center; margin-top: 20px;">
                                        <p>🎉 <strong>Success!</strong> Your message is now securely hidden.</p>
                                        <a href="${url}" download="secure_image.png" class="download-btn">📥 Download Secure Image</a>
                                    </div>
                                `;
                            });
                        }, 500);
                    }, 500);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } catch (error) {
            showProcessStep('processSteps', '❌ Encryption failed: ' + error.message, 'error');
        }
    }, 300);
}

function extractMessage() {
    const extractInput = document.getElementById('extractInput');
    const extractKey = document.getElementById('extractKey');
    
    if (!extractInput.files[0] || !extractKey.value) {
        alert('⚠️ Please select an image and enter the decryption key');
        return;
    }

    const file = extractInput.files[0];
    const key = extractKey.value;
    
    document.getElementById('decodeSteps').innerHTML = '';
    
    showProcessStep('decodeSteps', '🔍 Analyzing image for hidden data...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            setTimeout(() => {
                showProcessStep('decodeSteps', '🧩 Extracting hidden bits from pixels...');
                
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    let binaryMessage = '';
                    for (let i = 0; i < data.length; i += 4) {
                        for (let channel = 0; channel < 3; channel++) {
                            binaryMessage += (data[i + channel] & 1).toString();
                        }
                    }
                    
                    showProcessStep('decodeSteps', '🔐 Decrypting with AES-256...');
                    
                    setTimeout(() => {
                        const extractedText = binaryToString(binaryMessage);
                        const endIndex = extractedText.indexOf('###END###');
                        
                        if (endIndex !== -1) {
                            const encryptedMessage = extractedText.substring(0, endIndex);
                            try {
                                const decryptedMessage = decrypt(encryptedMessage, key);
                                if (decryptedMessage) {
                                    showProcessStep('decodeSteps', '✅ Message successfully decrypted!', 'success');
                                    document.getElementById('extractedMessage').innerHTML = `
                                        <div style="text-align: center;">
                                            <h4>🎉 Secret Message Revealed:</h4>
                                            <p style="font-size: 1.1em; font-weight: bold; color: #27ae60; margin-top: 15px;">${decryptedMessage}</p>
                                        </div>
                                    `;
                                } else {
                                    throw new Error('Empty decryption result');
                                }
                            } catch (e) {
                                showProcessStep('decodeSteps', '❌ Decryption failed: Wrong password', 'error');
                                document.getElementById('extractedMessage').innerHTML = 
                                    '<div class="error"><strong>❌ Error:</strong> Invalid password or corrupted data</div>';
                                document.getElementById('extractedMessage').classList.add('error');
                            }
                        } else {
                            showProcessStep('decodeSteps', '❌ No hidden message detected', 'error');
                            document.getElementById('extractedMessage').innerHTML = 
                                '<div class="error"><strong>❌ Error:</strong> No hidden message found in this image</div>';
                            document.getElementById('extractedMessage').classList.add('error');
                        }
                    }, 500);
                }, 500);
            }, 300);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Password strength for encrypt page
    const keyInput = document.getElementById('keyInput');
    if (keyInput) {
        keyInput.addEventListener('input', updatePasswordStrength);
    }
    
    // Character count for encrypt page
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', updateCharCount);
    }
    
    // Image preview for encrypt page
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        const fileDisplay = imageInput.parentElement.querySelector('.file-input-display');
        imageInput.addEventListener('change', function() {
            previewImage(this, 'imagePreview');
            if (this.files && this.files[0]) {
                fileDisplay.textContent = `📁 ${this.files[0].name}`;
                fileDisplay.classList.add('selected');
            }
        });
    }
    
    // Image preview for decrypt page
    const extractInput = document.getElementById('extractInput');
    if (extractInput) {
        const extractDisplay = extractInput.parentElement.querySelector('.file-input-display');
        extractInput.addEventListener('change', function() {
            previewImage(this, 'extractPreview');
            if (this.files && this.files[0]) {
                extractDisplay.textContent = `📁 ${this.files[0].name}`;
                extractDisplay.classList.add('selected');
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
});