const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

async function verifySlipOCR(imagePath, expectedAmount) {
  console.log(`\n🔍 [OCR] Reading image file: ${path.basename(imagePath)}`);
  
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ File not found at: ${imagePath}`);
    return;
  }

  try {
    console.log('⏳ Initializing local OCR engine (Tesseract.js)...');
    console.log('⏳ Running character recognition (English & Thai)...');
    
    // Run OCR locally (Uses language training data cache, 100% free)
    const result = await Tesseract.recognize(
      imagePath,
      'eng+tha',
      { logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`   [OCR Progress] Recognizing: ${(m.progress * 100).toFixed(0)}%`);
          }
        } 
      }
    );

    const extractedText = result.data.text;
    console.log('\n==========================================');
    console.log('📝 EXTRACTED TEXT FROM SLIP IMAGE:');
    console.log('==========================================');
    console.log(extractedText.trim());
    console.log('==========================================\n');

    console.log('⚙️ Running Programmatic Check Conditions (If-Else Rules):');

    // 1. Check if the slip contains transfer success keywords (Authenticity Check)
    const statusKeywords = [/โอนเงินสำเร็จ/i, /โอนสำเร็จ/i, /successful/i, /transfer/i, /success/i];
    const isTransferSuccess = statusKeywords.some(regex => regex.test(extractedText));
    if (isTransferSuccess) {
      console.log('✅ Rule 1 Passed: Valid transfer status keywords found in text.');
    } else {
      console.warn('⚠️ Rule 1 Warning: No explicit transfer status keyword detected in text.');
    }

    // 2. Check if the receiver matches our merchant account name (Receiver Check)
    const companyKeywords = [/เทอรา/i, /tera/i, /smart/i];
    const isReceiverCorrect = companyKeywords.some(regex => regex.test(extractedText));
    if (isReceiverCorrect) {
      console.log('✅ Rule 2 Passed: Receiver matches company name ("เทอรา สมาร์ท").');
    } else {
      console.error('❌ Rule 2 Failed: Receiver account name mismatch. Slip was not paid to our shop.');
    }

    // 3. Extract amount numbers and compare with expected price (Amount Matching Check)
    const amountRegex = /(\d{1,3}(,\d{3})*\.\d{2})/g;
    const matches = extractedText.match(amountRegex);
    let detectedAmount = null;

    if (matches) {
      const parsedAmounts = matches.map(m => parseFloat(m.replace(/,/g, '')));
      // Check if any match is close to our expected amount
      const matchingAmount = parsedAmounts.find(amt => Math.abs(amt - expectedAmount) < 0.01);
      if (matchingAmount) {
        detectedAmount = matchingAmount;
      }
    }

    if (detectedAmount) {
      console.log(`✅ Rule 3 Passed: Found matching transfer amount: ${detectedAmount} ฿ (Expected: ${expectedAmount} ฿).`);
    } else {
      console.error(`❌ Rule 3 Failed: Could not find matching transfer amount in slip text. Expected: ${expectedAmount} ฿.`);
    }

  } catch (err) {
    console.error('❌ OCR Processing Error:', err);
  }
}

// Test with our local Krungthai slip (expected price: 1.07 Baht)
const testSlipPath = path.join(__dirname, '../uploads/slip-1784173551821-349540595.jpg');
verifySlipOCR(testSlipPath, 1.07);
