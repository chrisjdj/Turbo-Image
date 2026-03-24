import React from 'react';
import { Shield, ImageIcon, Zap, UploadCloud, Layers, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="seo-footer">
      <noscript>
        <div className="noscript-banner">
          <p><strong>Note:</strong> TurboImage requires JavaScript to optimize images securely in your browser. All processing happens locally on your device.</p>
        </div>
      </noscript>
      
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-main">
            <h2>About TurboImage</h2>
            <p>TurboImage is a high-performance, browser-based image optimization suite. Built for speed and total privacy, it allows you to compress and convert images directly on your machine. No data ever leaves your browser, ensuring your photos and documents remain 100% private and secure.</p>
          </div>

          <div className="footer-features">
            <h3>Key Features</h3>
            <ul className="footer-feature-list">
              <li>
                <div className="feature-icon"><Shield size={16} /></div>
                <strong>100% Client-Side</strong> - Your images stay on your device. No server uploads.
              </li>
              <li>
                <div className="feature-icon"><ImageIcon size={16} /></div>
                <strong>Multi-Format Support</strong> - Convert between JPEG, PNG, WebP, AVIF, and SVG.
              </li>
              <li>
                <div className="feature-icon"><UploadCloud size={16} /></div>
                <strong>Batch Processing</strong> - Optimize dozens of images simultaneously with ease.
              </li>
              <li>
                <div className="feature-icon"><Zap size={16} /></div>
                <strong>Ultra-Fast Compression</strong> - Powered by WebAssembly (MozJPEG/OxiPNG) for native-feel performance.
              </li>
              <li>
                <div className="feature-icon"><Cpu size={16} /></div>
                <strong>Modern Engines</strong> - Utilizes the latest compression algorithms for maximum size reduction.
              </li>
              <li>
                <div className="feature-icon"><Layers size={16} /></div>
                <strong>Intuitive Workflow</strong> - Simple drag-and-drop interface with real-time compression stats.
              </li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} TurboImage. Privacy-respecting and serverless.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
