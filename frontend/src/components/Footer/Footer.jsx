import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-section">
            <div className="footer-brand">
              <span className="footer-icon">🌐</span>
              <h3>Community Hub</h3>
            </div>
            <p className="footer-tagline">Building stronger communities together</p>
            <div className="social-links">
              <a href="#facebook" className="social-link" aria-label="Facebook">f</a>
              <a href="#twitter" className="social-link" aria-label="Twitter">𝕏</a>
              <a href="#instagram" className="social-link" aria-label="Instagram">📷</a>
              <a href="#linkedin" className="social-link" aria-label="LinkedIn">in</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li><a href="#blog">Blog</a></li>
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#guides">Guides</a></li>
              <li><a href="#community">Community</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact & Support</h4>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon">✉️</span>
                <a href="mailto:info@communityhub.com">info@communityhub.com</a>
              </li>
              <li>
                <span className="contact-icon">📱</span>
                <a href="tel:+15551234567">+1 (555) 123-4567</a>
              </li>
              <li>
                <span className="contact-icon">📍</span>
                <span>123 Community St, Hub City, HC 12345</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {currentYear} Community Hub. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <span className="separator">•</span>
            <a href="#terms">Terms of Service</a>
            <span className="separator">•</span>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
