import React from 'react';
import { Shield, ImageIcon, Zap, UploadCloud, Layers, Cpu } from 'lucide-react';

const FEATURES = [
  { Icon: Shield, title: '100% client-side', text: 'Your images stay on your device. Nothing is uploaded to a server.' },
  { Icon: ImageIcon, title: 'Multi-format', text: 'Convert JPEG, PNG, WebP, AVIF, GIF, BMP and SVG into optimized JPEG, PNG, WebP or AVIF.' },
  { Icon: UploadCloud, title: 'Batch processing', text: 'Optimize dozens of images at once and download them as a ZIP.' },
  { Icon: Zap, title: 'Fast', text: 'WebAssembly codecs (MozJPEG, OxiPNG, libwebp, libavif) run in parallel workers.' },
  { Icon: Cpu, title: 'Modern engines', text: 'The latest compression algorithms for the smallest files at your chosen quality.' },
  { Icon: Layers, title: 'Simple workflow', text: 'Drag and drop or paste, with live stats and a before/after comparison.' },
];

export const Footer: React.FC = () => (
  <footer className="app-footer">
    <noscript>
      <div className="noscript-banner">
        <strong>Note:</strong> TurboImage needs JavaScript to optimize images in your browser. All processing happens locally on your device.
      </div>
    </noscript>

    <div className="container">
      <div className="app-footer__grid">
        <div>
          <h2>About TurboImage</h2>
          <p>
            TurboImage is a fast, browser-based image optimizer. It compresses and converts images directly on your
            machine, so your photos and documents never leave your browser.
          </p>
        </div>

        <div>
          <h3>Key features</h3>
          <ul className="app-footer__features">
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="feature-icon" aria-hidden>
                  <Icon size={16} />
                </span>
                <strong>{title}</strong>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="app-footer__bottom">
        <p>&copy; {new Date().getFullYear()} TurboImage. Private and serverless.</p>
        <a href="https://chrisjdj.github.io/web-tools/">More free tools</a>
      </div>
    </div>
  </footer>
);

export default Footer;
