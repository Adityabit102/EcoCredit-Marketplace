const PDFDocument = require('pdfkit');
const User = require('../models/User');
const { palette } = require('../config/brand');

// Streams a downloadable PDF carbon-offset certificate for the authenticated user.
// Themed with the brand palette so it doubles as a shareable, resume-ready artifact.
exports.generate = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const co2 = user.lifetimeCO2 || 0;
    const treesEquivalent = Math.round(co2 / 0.02); // ~0.02 t/tree/yr
    const certId = `EC-${String(user._id).slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ecocredit-certificate-${certId}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    doc.pipe(res);

    const W = doc.page.width, H = doc.page.height;
    doc.rect(0, 0, W, H).fill(palette.cream);
    doc.rect(0, 0, W, 14).fill(palette.pine);
    doc.rect(0, H - 14, W, 14).fill(palette.pine);
    doc.lineWidth(2).strokeColor(palette.sage).rect(30, 30, W - 60, H - 60).stroke();

    doc.fillColor(palette.pine).fontSize(34).font('Helvetica-Bold')
      .text('Certificate of Carbon Offset', 0, 80, { align: 'center' });
    doc.fillColor(palette.sage).fontSize(13).font('Helvetica')
      .text('EcoCredit Marketplace', { align: 'center' });

    doc.moveDown(2).fillColor('#444').fontSize(15)
      .text('This certifies that', { align: 'center' });
    doc.moveDown(0.4).fillColor(palette.pine).fontSize(28).font('Helvetica-Bold')
      .text(user.name, { align: 'center' });

    doc.moveDown(0.8).fillColor('#444').font('Helvetica').fontSize(15)
      .text('has offset a verified total of', { align: 'center' });
    doc.moveDown(0.3).fillColor(palette.pine).fontSize(40).font('Helvetica-Bold')
      .text(`${co2.toFixed(2)} tons CO₂`, { align: 'center' });
    doc.moveDown(0.3).fillColor(palette.sage).fontSize(14).font('Helvetica')
      .text(`equivalent to roughly ${treesEquivalent.toLocaleString()} trees grown for one year`, { align: 'center' });

    doc.fontSize(10).fillColor('#777')
      .text(`Certificate ID: ${certId}`, 60, H - 70)
      .text(`Issued: ${new Date().toLocaleDateString()}`, 60, H - 55);
    doc.text('Verified on-chain · EcoCredit', W - 260, H - 62, { width: 200, align: 'right' });

    doc.end();
  } catch (err) {
    next(err);
  }
};
