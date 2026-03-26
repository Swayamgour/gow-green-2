const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { extractTextFromImage } = require('../utils/ocrUtils');
const { generateMOMFromText } = require('../utils/momUtils');
const { generateMOMPDF } = require('../utils/momPdfUtils');

const momDir = path.join(process.cwd(), 'moms');
if (!fs.existsSync(momDir)) fs.mkdirSync(momDir, { recursive: true });

const scanAndGenerateMOM = async (req, res) => {
  const imagePath = req.file?.path;

  if (!imagePath) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  try {
    console.log('🔍 Running OCR on meeting notes...');
    const ocrResult = await extractTextFromImage(imagePath);

    if (!ocrResult.text?.trim()) {
      return res.status(422).json({ success: false, message: 'No text detected. Try a clearer image.' });
    }

    console.log('🤖 Generating MOM with Groq...');
    const mom = await generateMOMFromText(ocrResult.text);

    const momFileName = `MOM_${uuidv4()}.pdf`;
    const momPath = path.join(momDir, momFileName);
    await generateMOMPDF(mom, momPath);

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      success: true,
      message: 'MOM generated successfully',
      data: {
        momUrl: `${baseUrl}/moms/${momFileName}`,
        extractedText: ocrResult.text,
        wordCount: ocrResult.wordCount,
        mom
      }
    });
  } catch (error) {
    console.error('❌ MOM Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }
};

const generateMOMFromTextOnly = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'No text provided' });

  try {
    console.log('🤖 Generating MOM from text...');
    const mom = await generateMOMFromText(text);

    const momFileName = `MOM_${uuidv4()}.pdf`;
    const momPath = path.join(momDir, momFileName);
    await generateMOMPDF(mom, momPath);

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      success: true,
      data: {
        momUrl: `${baseUrl}/moms/${momFileName}`,
        mom
      }
    });
  } catch (error) {
    console.error('❌ MOM Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { scanAndGenerateMOM, generateMOMFromTextOnly };