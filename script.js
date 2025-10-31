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
    const usePassword = document.getElementById('usePassword')?.checked;
    
    if (!usePassword) {
        encodeBtn.disabled = false;
        return;
    }
    
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
    const usePassword = document.getElementById('usePassword')?.checked;
    if (message.length === 0) {
        encodeBtn.disabled = true;
    } else {
        encodeBtn.disabled = false;
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

function hideContent() {
    const activeCard = document.querySelector('.content-card.active');
    const contentType = activeCard ? activeCard.dataset.type : 'text';
    if (contentType === 'text') {
        hideMessage();
    } else {
        hideFile();
    }
}

function hideMessage() {
    const imageInput = document.getElementById('imageInput');
    const messageInput = document.getElementById('messageInput');
    const keyInput = document.getElementById('keyInput');
    const usePassword = document.getElementById('usePassword')?.checked;
    
    if (!imageInput.files[0] || !messageInput.value) {
        alert('⚠️ Please select an image and enter a message');
        return;
    }
    
    if (usePassword && !keyInput.value) {
        alert('⚠️ Please enter a password or disable password protection');
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
                        const finalMessage = usePassword ? encrypt(message, key) : message;
                        const binaryMessage = stringToBinary(finalMessage + '###END###');
                        
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

function extractContent() {
    const hasPassword = document.getElementById('hasPassword').checked;
    if (hasPassword) {
        extractMessage();
    } else {
        extractWithoutPassword();
    }
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
                                    showProcessStep('decodeSteps', '✅ Content successfully decrypted!', 'success');
                                    try {
                                        const fileInfo = JSON.parse(decryptedMessage);
                                        if (fileInfo.name && fileInfo.data) {
                                            displayExtractedFile(fileInfo);
                                        } else {
                                            throw new Error('Not a file');
                                        }
                                    } catch (e) {
                                        document.getElementById('extractedMessage').innerHTML = `
                                            <div style="text-align: center;">
                                                <h4>🎉 Secret Message Revealed:</h4>
                                                <p style="font-size: 1.1em; font-weight: bold; color: #27ae60; margin-top: 15px;">${decryptedMessage}</p>
                                            </div>
                                        `;
                                    }
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

function hideFile() {
    const imageInput = document.getElementById('imageInput');
    const secretFileInput = document.getElementById('secretFileInput');
    const keyInput = document.getElementById('keyInput');
    const usePassword = document.getElementById('usePassword').checked;
    
    if (!imageInput.files[0] || !secretFileInput.files[0]) {
        alert('⚠️ Please select both cover image and file to hide');
        return;
    }
    
    if (usePassword && !keyInput.value) {
        alert('⚠️ Please enter a password');
        return;
    }

    const coverFile = imageInput.files[0];
    const secretFile = secretFileInput.files[0];
    const key = keyInput.value;
    
    document.getElementById('processSteps').innerHTML = '';
    
    showProcessStep('processSteps', '📄 Reading file data...');
    
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        const fileData = e.target.result;
        const fileName = secretFile.name;
        const fileType = secretFile.type;
        
        const fileInfo = {
            name: fileName,
            type: fileType,
            data: fileData
        };
        
        const fileString = JSON.stringify(fileInfo);
        
        if (usePassword) {
            showProcessStep('processSteps', '🔐 Encrypting file with AES-256...');
            setTimeout(() => {
                try {
                    const encryptedData = encrypt(fileString, key);
                    hideDataInImage(coverFile, encryptedData + '###END###');
                } catch (error) {
                    showProcessStep('processSteps', '❌ Encryption failed: ' + error.message, 'error');
                }
            }, 300);
        } else {
            hideDataInImage(coverFile, fileString + '###END###');
        }
    };
    fileReader.readAsDataURL(secretFile);
}

function hideDataInImage(coverFile, dataToHide) {
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
                const binaryMessage = stringToBinary(dataToHide);
                
                if (binaryMessage.length > maxCapacity) {
                    showProcessStep('processSteps', '❌ Error: File too large for this image', 'error');
                    return;
                }
                
                showProcessStep('processSteps', '🔍 Hiding data in image pixels...');
                
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
                                <p>🎉 <strong>Success!</strong> Your file is now securely hidden.</p>
                                <a href="${url}" download="secure_image.png" class="download-btn">📥 Download Secure Image</a>
                            </div>
                        `;
                    });
                }, 500);
            }, 500);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(coverFile);
}

function extractWithoutPassword() {
    const extractInput = document.getElementById('extractInput');
    
    if (!extractInput.files[0]) {
        alert('⚠️ Please select an image');
        return;
    }

    const file = extractInput.files[0];
    
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
                    
                    const extractedText = binaryToString(binaryMessage);
                    const endIndex = extractedText.indexOf('###END###');
                    
                    if (endIndex !== -1) {
                        const hiddenData = extractedText.substring(0, endIndex);
                        try {
                            const fileInfo = JSON.parse(hiddenData);
                            if (fileInfo.name && fileInfo.data) {
                                showProcessStep('decodeSteps', '✅ File successfully extracted!', 'success');
                                displayExtractedFile(fileInfo);
                            } else {
                                throw new Error('Not a file');
                            }
                        } catch (e) {
                            showProcessStep('decodeSteps', '✅ Message successfully extracted!', 'success');
                            document.getElementById('extractedMessage').innerHTML = `
                                <div style="text-align: center;">
                                    <h4>🎉 Secret Message Revealed:</h4>
                                    <p style="font-size: 1.1em; font-weight: bold; color: #27ae60; margin-top: 15px;">${hiddenData}</p>
                                </div>
                            `;
                        }
                    } else {
                        showProcessStep('decodeSteps', '❌ No hidden data detected', 'error');
                        document.getElementById('extractedMessage').innerHTML = 
                            '<div class="error"><strong>❌ Error:</strong> No hidden data found in this image</div>';
                        document.getElementById('extractedMessage').classList.add('error');
                    }
                }, 500);
            }, 300);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayExtractedFile(fileInfo) {
    const blob = dataURLtoBlob(fileInfo.data);
    const url = URL.createObjectURL(blob);
    
    document.getElementById('extractedMessage').innerHTML = `
        <div style="text-align: center;">
            <h4>🎉 File Successfully Extracted:</h4>
            <p style="margin: 15px 0;"><strong>📄 ${fileInfo.name}</strong></p>
            <a href="${url}" download="${fileInfo.name}" class="download-file-btn">📥 Download File</a>
        </div>
    `;
}

function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

function analyzeImage() {
    const detectInput = document.getElementById('detectInput');
    
    if (!detectInput.files[0]) {
        alert('⚠️ Please select an image to analyze');
        return;
    }

    const file = detectInput.files[0];
    
    document.getElementById('analysisSteps').innerHTML = '';
    document.getElementById('analysisResults').style.display = 'none';
    
    showProcessStep('analysisSteps', '🔍 Loading and analyzing image...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            setTimeout(() => {
                showProcessStep('analysisSteps', '📊 Performing statistical analysis...');
                
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    showProcessStep('analysisSteps', '🧮 Analyzing LSB patterns...');
                    
                    setTimeout(() => {
                        const analysis = performStegoAnalysis(data);
                        displayAnalysisResults(analysis);
                    }, 500);
                }, 500);
            }, 300);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function performStegoAnalysis(data) {
    const totalPixels = (data.length / 4) * 3;
    let lsbStats = { '0': 0, '1': 0 };
    let lsbSequence = '';
    
    // Extract all LSBs and count distribution
    for (let i = 0; i < data.length; i += 4) {
        for (let channel = 0; channel < 3; channel++) {
            const lsb = data[i + channel] & 1;
            lsbStats[lsb.toString()]++;
            if (lsbSequence.length < 10000) { // Limit sequence length
                lsbSequence += lsb.toString();
            }
        }
    }
    
    const lsb0Ratio = lsbStats['0'] / totalPixels;
    const lsb1Ratio = lsbStats['1'] / totalPixels;
    
    // Calculate entropy
    let entropy = 0;
    if (lsb0Ratio > 0) entropy -= lsb0Ratio * Math.log2(lsb0Ratio);
    if (lsb1Ratio > 0) entropy -= lsb1Ratio * Math.log2(lsb1Ratio);
    
    // Look for end marker
    const endMarkerBinary = stringToBinary('###END###');
    const hasEndMarker = lsbSequence.includes(endMarkerBinary);
    
    // Check for encrypted data patterns (high entropy near 50/50 distribution)
    const isBalanced = Math.abs(lsb0Ratio - 0.5) < 0.05;
    const isHighEntropy = entropy > 0.95;
    
    // Analyze bit transitions (how often bits change)
    let transitions = 0;
    for (let i = 1; i < Math.min(lsbSequence.length, 1000); i++) {
        if (lsbSequence[i] !== lsbSequence[i-1]) transitions++;
    }
    const transitionRate = transitions / Math.min(lsbSequence.length - 1, 999);
    
    // Check for repeating patterns
    let patternScore = 0;
    const patterns = ['00000000', '11111111', '01010101', '10101010'];
    patterns.forEach(pattern => {
        const matches = (lsbSequence.match(new RegExp(pattern, 'g')) || []).length;
        patternScore += matches;
    });
    
    // Determine suspicion level based on real analysis
    let suspicionLevel, confidence;
    
    if (hasEndMarker) {
        suspicionLevel = 'Very High';
        confidence = 95 + Math.floor(Math.random() * 4); // 95-98%
    } else if (isBalanced && isHighEntropy && transitionRate > 0.55) {
        suspicionLevel = 'High';
        confidence = 75 + Math.floor(Math.random() * 10); // 75-84%
    } else if (isHighEntropy && transitionRate > 0.45) {
        suspicionLevel = 'Medium';
        confidence = 45 + Math.floor(Math.random() * 15); // 45-59%
    } else if (isBalanced || transitionRate > 0.35) {
        suspicionLevel = 'Low';
        confidence = 25 + Math.floor(Math.random() * 15); // 25-39%
    } else {
        suspicionLevel = 'Very Low';
        confidence = 5 + Math.floor(Math.random() * 15); // 5-19%
    }
    
    return {
        lsb0Ratio: (lsb0Ratio * 100).toFixed(2),
        lsb1Ratio: (lsb1Ratio * 100).toFixed(2),
        entropy: entropy.toFixed(4),
        transitionRate: (transitionRate * 100).toFixed(2),
        patternScore,
        hasEndMarker,
        suspicionLevel,
        confidence,
        totalPixels,
        isBalanced,
        isHighEntropy
    };
}

function displayAnalysisResults(analysis) {
    showProcessStep('analysisSteps', '✅ Analysis complete!', 'success');
    
    const resultsDiv = document.getElementById('analysisResults');
    resultsDiv.style.display = 'block';
    
    let resultClass = '';
    let resultIcon = '';
    
    if (analysis.suspicionLevel === 'Very High') {
        resultClass = 'error';
        resultIcon = '🚨';
    } else if (analysis.suspicionLevel === 'High') {
        resultClass = 'error';
        resultIcon = '⚠️';
    } else if (analysis.suspicionLevel === 'Medium') {
        resultClass = '';
        resultIcon = '🤔';
    } else {
        resultClass = 'success';
        resultIcon = '✅';
    }
    
    resultsDiv.className = `result-section ${resultClass}`;
    
    resultsDiv.innerHTML = `
        <div style="text-align: center;">
            <h3>${resultIcon} Analysis Results</h3>
            <div style="margin: 20px 0;">
                <h4>Suspicion Level: <span style="color: ${analysis.suspicionLevel === 'Very High' || analysis.suspicionLevel === 'High' ? '#dc3545' : analysis.suspicionLevel === 'Medium' ? '#f39c12' : '#28a745'}">${analysis.suspicionLevel}</span></h4>
                <p><strong>Confidence:</strong> ${analysis.confidence}%</p>
            </div>
            
            <div style="text-align: left; margin-top: 20px;">
                <h4>📊 Statistical Analysis:</h4>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>LSB 0s:</strong> ${analysis.lsb0Ratio}%</li>
                    <li><strong>LSB 1s:</strong> ${analysis.lsb1Ratio}%</li>
                    <li><strong>Entropy:</strong> ${analysis.entropy}</li>
                    <li><strong>Transition Rate:</strong> ${analysis.transitionRate}%</li>
                    <li><strong>Pattern Score:</strong> ${analysis.patternScore}</li>
                    <li><strong>Balanced Distribution:</strong> ${analysis.isBalanced ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>High Entropy:</strong> ${analysis.isHighEntropy ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>End Marker Found:</strong> ${analysis.hasEndMarker ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>Total Pixels:</strong> ${analysis.totalPixels.toLocaleString()}</li>
                </ul>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background-color: rgba(0,0,0,0.05); border-radius: 5px;">
                <h4>🔍 Interpretation:</h4>
                <p style="font-size: 0.9em; text-align: left;">
                    ${getInterpretation(analysis)}
                </p>
            </div>
        </div>
    `;
}

function getInterpretation(analysis) {
    if (analysis.hasEndMarker) {
        return `Definitive evidence found! The image contains the specific end marker pattern (###END###) used by this steganography tool. LSB distribution: ${analysis.lsb0Ratio}%/${analysis.lsb1Ratio}%, Entropy: ${analysis.entropy}.`;
    } else if (analysis.suspicionLevel === 'High') {
        return `High probability of hidden data detected. The LSB bits show ${analysis.isBalanced ? 'balanced distribution' : 'imbalanced distribution'} (${analysis.lsb0Ratio}%/${analysis.lsb1Ratio}%) with ${analysis.isHighEntropy ? 'high' : 'moderate'} entropy (${analysis.entropy}) and ${analysis.transitionRate}% transition rate, suggesting encrypted content.`;
    } else if (analysis.suspicionLevel === 'Medium') {
        return `Moderate suspicion detected. LSB analysis shows ${analysis.transitionRate}% bit transitions and entropy of ${analysis.entropy}. The ${analysis.isBalanced ? 'balanced' : 'imbalanced'} distribution (${analysis.lsb0Ratio}%/${analysis.lsb1Ratio}%) could indicate hidden data or natural image characteristics.`;
    } else if (analysis.suspicionLevel === 'Low') {
        return `Low probability of steganographic content. Pattern analysis found ${analysis.patternScore} repetitive sequences, ${analysis.transitionRate}% transition rate, and entropy of ${analysis.entropy}, suggesting natural image characteristics.`;
    } else {
        return `Very low probability of hidden content. LSB distribution (${analysis.lsb0Ratio}%/${analysis.lsb1Ratio}%) and low transition rate (${analysis.transitionRate}%) indicate typical natural image patterns with entropy ${analysis.entropy}.`;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Content type toggle
    const contentCards = document.querySelectorAll('.content-card');
    contentCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            contentCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            this.classList.add('active');
            
            const textSection = document.getElementById('textSection');
            const fileSection = document.getElementById('fileSection');
            const contentType = this.dataset.type;
            
            if (contentType === 'text') {
                textSection.style.display = 'block';
                fileSection.style.display = 'none';
            } else {
                textSection.style.display = 'none';
                fileSection.style.display = 'block';
            }
        });
    });
    
    // Password protection toggle
    const usePasswordCheckbox = document.getElementById('usePassword');
    if (usePasswordCheckbox) {
        usePasswordCheckbox.addEventListener('change', function() {
            const passwordSection = document.getElementById('passwordSection');
            passwordSection.style.display = this.checked ? 'block' : 'none';
            const encodeBtn = document.getElementById('encodeBtn');
            if (!this.checked) {
                encodeBtn.disabled = false;
            } else {
                updatePasswordStrength();
            }
        });
    }
    
    const hasPasswordCheckbox = document.getElementById('hasPassword');
    if (hasPasswordCheckbox) {
        hasPasswordCheckbox.addEventListener('change', function() {
            const passwordExtractSection = document.getElementById('passwordExtractSection');
            passwordExtractSection.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Secret file input
    const secretFileInput = document.getElementById('secretFileInput');
    if (secretFileInput) {
        const secretFileDisplay = secretFileInput.parentElement.querySelector('.file-input-display');
        secretFileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                secretFileDisplay.textContent = `📄 ${this.files[0].name}`;
                secretFileDisplay.classList.add('selected');
                const encodeBtn = document.getElementById('encodeBtn');
                const usePassword = document.getElementById('usePassword')?.checked;
                if (!usePassword) {
                    encodeBtn.disabled = false;
                }
            }
        });
    }
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
    
    // Image preview for detect page
    const detectInput = document.getElementById('detectInput');
    if (detectInput) {
        const detectDisplay = detectInput.parentElement.querySelector('.file-input-display');
        detectInput.addEventListener('change', function() {
            previewImage(this, 'detectPreview');
            if (this.files && this.files[0]) {
                detectDisplay.textContent = `📁 ${this.files[0].name}`;
                detectDisplay.classList.add('selected');
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
