import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Monitor, Headset } from 'lucide-react';

const AssetQRCode = ({ assetName, barcodeValue }) => {
  const qrRef = useRef();

  const handlePrint = (type) => {
    // Get the raw SVG of the QR code
    const printContent = qrRef.current.innerHTML;

    // Define exact physical dimensions based on the button clicked
    const isHeadset = type === 'HEADSET';
    const boxSize = isHeadset ? '1.25in' : '2.5in';
    const padding = isHeadset ? '0.1in' : '0.2in';
    const fontSize = isHeadset ? '10px' : '16px';
    const titleSize = isHeadset ? '8px' : '12px';

    const printWindow = window.open('', '', 'width=600,height=600');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${barcodeValue}</title>
          <style>
            /* Tells the printer exactly how big the paper/label should be */
            @page { 
              size: ${boxSize} ${boxSize}; 
              margin: 0; 
            }
            body { 
              margin: 0; 
              display: flex; 
              align-items: flex-start; 
              justify-content: flex-start; 
              font-family: sans-serif;
              background: white;
            }
            /* The physical boundary of the label */
            .label-box { 
              width: ${boxSize}; 
              height: ${boxSize}; 
              padding: ${padding};
              box-sizing: border-box;
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              text-align: center;
              border: 1px dashed #ccc; /* Cutting guide for standard paper */
            }
            .qr-container {
              width: 100%;
              display: flex;
              justify-content: center;
            }
            .qr-container svg {
              width: 100%;
              height: auto;
              max-height: ${isHeadset ? '0.7in' : '1.5in'};
            }
            h1 { 
              margin: 2px 0 0 0; 
              font-size: ${titleSize}; 
              font-weight: normal; 
              color: #555;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            h2 { 
              margin: 2px 0 0 0; 
              font-size: ${fontSize}; 
              font-weight: bold; 
              color: #000;
            }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="qr-container">
              ${printContent}
            </div>
            <h2>${barcodeValue}</h2>
            <h1>${assetName}</h1>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!barcodeValue) {
    return <div className="text-sm text-gray-400 italic">No barcode assigned to this asset.</div>;
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hidden QR Code used just for generating the SVG data */}
      <div ref={qrRef} className="bg-white p-2 border border-gray-100 rounded-lg shadow-sm mb-4">
        <QRCode
          value={barcodeValue}
          size={120}
          level="H"
        />
      </div>

      {/* Print Option Buttons */}
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={() => handlePrint('PC')}
          className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-md text-sm font-bold transition-colors w-full border border-blue-200"
        >
          <Monitor className="w-4 h-4" />
          Print PC Label (2.5")
        </button>

        <button
          onClick={() => handlePrint('HEADSET')}
          className="flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-md text-sm font-bold transition-colors w-full border border-purple-200"
        >
          <Headset className="w-4 h-4" />
          Print Headset Label (1.25")
        </button>
      </div>
    </div>
  );
};

export default AssetQRCode;